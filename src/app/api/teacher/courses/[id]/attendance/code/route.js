import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { todayDateString } from "@/lib/attendanceDisplay";
import { generateAttendanceCode, codeExpiresAt, isCodeExpired } from "@/lib/attendanceCode";

async function loadOwnedCourse(courseId, teacherId) {
  return prisma.course.findFirst({
    where: { id: courseId, teacherId },
    select: { id: true },
  });
}

// GET /api/teacher/courses/:id/attendance/code — the current live session
// code for today, if one has been generated and hasn't expired yet. Lets
// the attendance page show the code after a refresh without silently
// rotating it (rotating is a deliberate teacher action, see POST below).
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadOwnedCourse(params.id, user.id);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const date = new Date(todayDateString());
  const session = await prisma.attendanceSession.findUnique({
    where: { courseId_date: { courseId: course.id, date } },
    select: { code: true, expiresAt: true },
  });

  if (!session || isCodeExpired(session)) {
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({ session });
}

// POST /api/teacher/courses/:id/attendance/code — generate a fresh code
// for today, immediately invalidating whatever code was live before (the
// unique [courseId, date] constraint means this is an upsert, not a new
// row per code). This is the only way students can self-mark PRESENT —
// see the POST handler in api/student/courses/:id/attendance.
export async function POST(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadOwnedCourse(params.id, user.id);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const date = new Date(todayDateString());
  const code = generateAttendanceCode();
  const expiresAt = codeExpiresAt();

  const session = await prisma.attendanceSession.upsert({
    where: { courseId_date: { courseId: course.id, date } },
    update: { code, expiresAt },
    create: { courseId: course.id, date, code, expiresAt },
    select: { code: true, expiresAt: true },
  });

  return NextResponse.json({ session }, { status: 201 });
}
