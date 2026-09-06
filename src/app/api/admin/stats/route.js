import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { todayDateString, attendancePercent } from "@/lib/attendanceDisplay";

// GET /api/admin/stats — live headline numbers and activity feed for the
// Admin overview. Every figure is derived at read time from the same
// tables the rest of the Admin panel already writes to, so the dashboard
// can never drift out of sync with reality the way a hardcoded mock could.
export async function GET() {
  const { error } = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const today = todayDateString();

  const [
    totalCourses,
    publishedCourses,
    totalTeachers,
    totalStudents,
    totalEnrollments,
    openSubmissions,
    todaysAttendance,
    recentEnrollments,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.taskSubmission.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.attendance.findMany({ where: { date: new Date(today) }, select: { status: true } }),
    prisma.enrollment.findMany({
      orderBy: { enrolledAt: "desc" },
      take: 5,
      select: {
        id: true,
        enrolledAt: true,
        student: { select: { name: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.task.findMany({
      where: { deadline: { gte: new Date() }, status: "PUBLISHED" },
      orderBy: { deadline: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        deadline: true,
        course: { select: { title: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalCourses,
      publishedCourses,
      totalTeachers,
      totalStudents,
      totalEnrollments,
      openSubmissions,
      todaysAttendance: todaysAttendance.length ? attendancePercent(todaysAttendance) : null,
    },
    recentEnrollments: recentEnrollments.map((e) => ({
      id: e.id,
      studentName: e.student.name,
      courseTitle: e.course.title,
      enrolledAt: e.enrolledAt,
    })),
    upcomingDeadlines: upcomingDeadlines.map((t) => ({
      id: t.id,
      title: t.title,
      courseTitle: t.course.title,
      deadline: t.deadline,
    })),
  });
}
