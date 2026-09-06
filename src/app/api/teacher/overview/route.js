import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures } from "@/lib/courseContent";
import { todayDateString } from "@/lib/attendanceDisplay";

// GET /api/teacher/overview — real numbers for the Teacher dashboard's
// stat cards and side panels (previously hard-coded mock data). Everything
// here is derived at read time from the same Course/Task/TaskSubmission/
// Attendance rows the rest of the Teacher area already reads and writes,
// scoped to courses this teacher is assigned to.
export async function GET() {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    select: {
      id: true,
      title: true,
      modules: { select: { lectures: { select: { id: true } } } },
      enrollments: { select: { studentId: true } },
    },
  });
  const courseIds = courses.map((c) => c.id);
  const studentIds = new Set(courses.flatMap((c) => c.enrollments.map((e) => e.studentId)));
  const totalLectures = courses.reduce((sum, c) => sum + flattenLectures(c.modules).length, 0);

  const [tasks, submittedRows, todaysAttendance] = await Promise.all([
    prisma.task.findMany({
      where: { courseId: { in: courseIds }, status: "PUBLISHED" },
      select: { id: true, title: true, deadline: true, course: { select: { title: true } } },
    }),
    prisma.taskSubmission.findMany({
      where: { status: "SUBMITTED", task: { courseId: { in: courseIds } } },
      orderBy: { submittedAt: "asc" },
      take: 6,
      select: {
        id: true,
        submittedAt: true,
        student: { select: { name: true } },
        task: { select: { title: true, course: { select: { title: true } } } },
      },
    }),
    courseIds.length
      ? prisma.attendance.findMany({
          where: { courseId: { in: courseIds }, date: new Date(todayDateString()) },
          select: { status: true },
        })
      : [],
  ]);

  const now = Date.now();
  const upcomingTasks = tasks.filter((t) => new Date(t.deadline).getTime() >= now);
  const orderedUpcoming = [...upcomingTasks]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  const todaysPresentOrLate = todaysAttendance.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;
  const todaysAttendancePercent = todaysAttendance.length
    ? Math.round((todaysPresentOrLate / todaysAttendance.length) * 100)
    : null;

  return NextResponse.json({
    stats: {
      assignedCourses: courses.length,
      totalStudents: studentIds.size,
      todaysAttendancePercent,
      pendingSubmissions: submittedRows.length,
      upcomingTasks: upcomingTasks.length,
      totalLectures,
    },
    pendingSubmissions: submittedRows.map((s) => ({
      id: s.id,
      student: s.student.name,
      task: s.task.title,
      course: s.task.course.title,
    })),
    upcomingDeadlines: orderedUpcoming.map((t) => ({
      id: t.id,
      title: t.title,
      course: t.course.title,
      deadline: t.deadline,
    })),
  });
}
