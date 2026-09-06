import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notifyUsers } from "@/lib/notify";
import { formatDateLabel } from "@/lib/attendanceDisplay";

// POST /api/teacher/courses/:id/attendance/request-unlock — a teacher can't
// edit a record once it's past ATTENDANCE_EDIT_WINDOW_DAYS, so this pings
// every Admin/Super Admin with the specific (course, student, date) that
// needs a correction. The Admin makes the actual unlock from the Admin
// attendance page (PRD section 5: Admin manages "Attendance Settings").
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findFirst({
    where: { id: params.id, teacherId: user.id },
    select: { id: true, title: true },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { studentId, date } = body || {};
  if (!studentId || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return NextResponse.json({ error: "A student and date are required." }, { status: 422 });
  }

  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    select: { id: true, name: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });

  await notifyUsers(
    admins.map((a) => a.id),
    {
      type: "ATTENDANCE_REMINDER",
      title: `Attendance unlock requested — ${course.title}`,
      body: `${user.name} wants to correct ${student.name}'s attendance for ${formatDateLabel(date)}.`,
      link: "/admin/attendance",
    }
  );

  return NextResponse.json({ ok: true });
}
