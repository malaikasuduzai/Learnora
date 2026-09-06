import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { attendancePercent } from "@/lib/attendanceDisplay";

// GET /api/teacher/courses/:id/attendance/summary — "Teachers should be
// able to monitor students with low attendance" (PRD section 22), the
// Present/Absent/Attendance% table from that same section.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findFirst({
    where: { id: params.id, teacherId: user.id },
    select: { id: true },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    orderBy: { student: { name: "asc" } },
    select: { student: { select: { id: true, name: true, email: true } } },
  });

  const records = await prisma.attendance.findMany({
    where: { courseId: course.id },
    select: { studentId: true, status: true },
  });

  const byStudent = new Map();
  for (const record of records) {
    if (!byStudent.has(record.studentId)) byStudent.set(record.studentId, []);
    byStudent.get(record.studentId).push(record);
  }

  const students = enrollments.map(({ student }) => {
    const studentRecords = byStudent.get(student.id) ?? [];
    return {
      student,
      present: studentRecords.filter((r) => r.status === "PRESENT").length,
      late: studentRecords.filter((r) => r.status === "LATE").length,
      absent: studentRecords.filter((r) => r.status === "ABSENT").length,
      total: studentRecords.length,
      percent: attendancePercent(studentRecords),
    };
  });

  return NextResponse.json({ students });
}
