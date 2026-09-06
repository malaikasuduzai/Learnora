import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { formatDateLabel } from "@/lib/attendanceDisplay";

// POST /api/admin/attendance/unlock — grants a one-time exception to edit
// an attendance record that's past the normal edit window. The teacher
// gets exactly one more save on that (course, student, date) before it
// locks again (see adminUnlockedAt handling in the teacher attendance
// POST route).
export async function POST(request) {
  const { user, error } = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { courseId, studentId, date } = body || {};
  if (!courseId || !studentId || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return NextResponse.json({ error: "A course, student and date are required." }, { status: 422 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, teacherId: true },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const record = await prisma.attendance.findUnique({
    where: { courseId_studentId_date: { courseId, studentId, date: new Date(date) } },
  });
  if (!record) return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { adminUnlockedAt: new Date() },
  });

  if (course.teacherId) {
    await notifyUser({
      userId: course.teacherId,
      type: "ATTENDANCE_REMINDER",
      title: `Attendance unlocked — ${course.title}`,
      body: `${user.name} unlocked ${formatDateLabel(date)} so you can make one correction.`,
      link: "/teacher/attendance",
    });
  }

  return NextResponse.json({ ok: true, record: updated });
}
