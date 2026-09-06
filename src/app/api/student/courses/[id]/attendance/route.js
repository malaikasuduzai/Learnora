import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isWithinAttendanceWindow, todayDateString } from "@/lib/attendanceDisplay";
import { studentMarkAttendanceSchema, flattenZodError } from "@/lib/validations";
import { codesMatch, isCodeExpired } from "@/lib/attendanceCode";

// POST /api/student/courses/:id/attendance — "Mark daily attendance within
// the permitted attendance window" (PRD section 11/20). Always writes
// PRESENT: a student can never self-report ABSENT or LATE, only a teacher
// can (see the teacher attendance route). The window check is repeated here
// server-side — the button being enabled client-side is just a courtesy,
// this is the check that actually decides it.
//
// Anti-spoofing: the window alone only proves a student clicked a button
// during class hours, not that they were actually there. They must also
// supply the teacher's live session code (see lib/attendanceCode.js and
// the teacher attendance/code route) — something only visible/audible to
// someone actually in the room or on the call.
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = studentMarkAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId: params.id, studentId: user.id },
    select: {
      course: {
        select: { id: true, attendanceWindowStart: true, attendanceWindowEnd: true },
      },
    },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "You're not enrolled in this course." }, { status: 404 });
  }
  const course = enrollment.course;

  if (!isWithinAttendanceWindow(course)) {
    return NextResponse.json(
      { error: course.attendanceWindowStart ? "Attendance window closed." : "Attendance isn't open for this course yet." },
      { status: 400 }
    );
  }

  const today = todayDateString();
  const date = new Date(today);

  const session = await prisma.attendanceSession.findUnique({
    where: { courseId_date: { courseId: course.id, date } },
    select: { code: true, expiresAt: true },
  });
  if (!session || isCodeExpired(session)) {
    return NextResponse.json(
      { error: "Your teacher hasn't shared today's attendance code yet — ask them to display it." },
      { status: 400 }
    );
  }
  if (!codesMatch(session.code, parsed.data.code)) {
    return NextResponse.json(
      { error: "That code doesn't match. Double-check with your teacher." },
      { status: 400 }
    );
  }

  const existing = await prisma.attendance.findUnique({
    where: { courseId_studentId_date: { courseId: course.id, studentId: user.id, date } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "You've already marked attendance for today." }, { status: 409 });
  }

  const record = await prisma.attendance.create({
    data: { courseId: course.id, studentId: user.id, date, status: "PRESENT", markedBy: "STUDENT" },
    select: { id: true, courseId: true, date: true, status: true, markedBy: true, markedAt: true },
  });

  return NextResponse.json({ record }, { status: 201 });
}
