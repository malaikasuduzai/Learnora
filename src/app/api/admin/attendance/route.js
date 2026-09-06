export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { todayDateString, isAttendanceRecordLocked } from "@/lib/attendanceDisplay";
import { NextResponse } from "next/server";

// GET /api/admin/attendance?courseId=&date= — the same roster shape the
// teacher sees (PRD section 5: Admin manages "Attendance Settings"), but
// unscoped from any one teacher's assignments so an Admin can look up any
// course to review or unlock a record.
export async function GET(request) {
  const { error } = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "A course is required." }, { status: 400 });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const date = searchParams.get("date")?.trim() || todayDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    orderBy: { student: { name: "asc" } },
    select: { student: { select: { id: true, name: true, email: true } } },
  });

  const records = await prisma.attendance.findMany({
    where: { courseId: course.id, date: new Date(date) },
    select: { studentId: true, status: true, markedBy: true, markedAt: true, adminUnlockedAt: true },
  });
  const byStudent = new Map(records.map((r) => [r.studentId, r]));

  const students = enrollments.map(({ student }) => {
    const raw = byStudent.get(student.id) ?? null;
    if (!raw) return { student, record: null, locked: false };
    const record = {
      studentId: raw.studentId,
      status: raw.status,
      markedBy: raw.markedBy,
      markedAt: raw.markedAt,
      adminUnlocked: Boolean(raw.adminUnlockedAt),
    };
    return { student, record, locked: isAttendanceRecordLocked(record) };
  });

  return NextResponse.json({ course, date, students });
}
