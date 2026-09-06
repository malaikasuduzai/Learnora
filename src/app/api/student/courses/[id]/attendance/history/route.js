import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { attendancePercent } from "@/lib/attendanceDisplay";

// GET /api/student/courses/:id/attendance/history — "Students should be
// able to view their complete attendance history" (PRD section 21), with
// the date/status/marked-at table and computed percentage from that
// section's example.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId: params.id, studentId: user.id },
    select: { course: { select: { id: true, title: true } } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "You're not enrolled in this course." }, { status: 404 });
  }

  const records = await prisma.attendance.findMany({
    where: { courseId: params.id, studentId: user.id },
    orderBy: { date: "desc" },
    select: { id: true, date: true, status: true, markedBy: true, markedAt: true },
  });

  return NextResponse.json({
    course: enrollment.course,
    records,
    percent: attendancePercent(records),
  });
}
