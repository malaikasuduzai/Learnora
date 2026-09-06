import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures, courseProgressPercent } from "@/lib/courseContent";
import { attendancePercent } from "@/lib/attendanceDisplay";

// GET /api/student/progress — "Student Progress Tracking" (PRD section
// 24): one overall summary plus a per-course breakdown of lecture
// progress, task completion and attendance, for the student's dedicated
// Progress page. Nothing here is stored separately — it's all derived at
// read time from the same models Days 4, 5 and 7 already use (lecture
// progress, task submissions, attendance records), the same
// derive-don't-store approach as My Courses and Upcoming Activities.
export async function GET() {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          attendanceWindowStart: true,
          modules: { select: { id: true, order: true, lectures: { select: { id: true } } } },
        },
      },
    },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const [progressRows, assignments, submissions, attendanceRows] = await Promise.all([
    courseIds.length
      ? prisma.lectureProgress.findMany({
          where: { studentId: user.id, lecture: { module: { courseId: { in: courseIds } } } },
          select: { lecture: { select: { module: { select: { courseId: true } } } } },
        })
      : [],
    courseIds.length
      ? prisma.taskAssignment.findMany({
          where: { studentId: user.id, task: { courseId: { in: courseIds }, status: "PUBLISHED" } },
          select: { task: { select: { id: true, courseId: true } } },
        })
      : [],
    courseIds.length
      ? prisma.taskSubmission.findMany({
          where: { studentId: user.id },
          select: { taskId: true, status: true },
        })
      : [],
    courseIds.length
      ? prisma.attendance.findMany({
          where: { studentId: user.id, courseId: { in: courseIds } },
          select: { courseId: true, status: true },
        })
      : [],
  ]);

  const completedLecturesByCourse = new Map();
  for (const row of progressRows) {
    const courseId = row.lecture.module.courseId;
    completedLecturesByCourse.set(courseId, (completedLecturesByCourse.get(courseId) ?? 0) + 1);
  }

  const tasksByCourse = new Map();
  for (const { task } of assignments) {
    if (!tasksByCourse.has(task.courseId)) tasksByCourse.set(task.courseId, []);
    tasksByCourse.get(task.courseId).push(task.id);
  }
  const submissionByTask = new Map(submissions.map((s) => [s.taskId, s]));

  const attendanceByCourse = new Map();
  for (const row of attendanceRows) {
    if (!attendanceByCourse.has(row.courseId)) attendanceByCourse.set(row.courseId, []);
    attendanceByCourse.get(row.courseId).push(row);
  }

  let lecturesTotal = 0;
  let lecturesCompleted = 0;
  let tasksTotal = 0;
  let tasksCompleted = 0;
  const attendancePercentages = [];

  const courses = enrollments.map(({ course }) => {
    const flat = flattenLectures(course.modules);
    const totalLectures = flat.length;
    const completedLectures = completedLecturesByCourse.get(course.id) ?? 0;

    const taskIds = tasksByCourse.get(course.id) ?? [];
    const completedTasks = taskIds.filter((id) => submissionByTask.get(id)?.status === "COMPLETED").length;

    const hasAttendanceWindow = Boolean(course.attendanceWindowStart);
    const records = attendanceByCourse.get(course.id) ?? [];
    const attendancePct = hasAttendanceWindow ? attendancePercent(records) : null;

    lecturesTotal += totalLectures;
    lecturesCompleted += completedLectures;
    tasksTotal += taskIds.length;
    tasksCompleted += completedTasks;
    if (attendancePct !== null) attendancePercentages.push(attendancePct);

    return {
      id: course.id,
      title: course.title,
      thumbnail: course.thumbnail,
      progress: courseProgressPercent(totalLectures, completedLectures),
      totalLectures,
      completedLectures,
      totalTasks: taskIds.length,
      completedTasks,
      attendancePercent: attendancePct,
    };
  });

  const summary = {
    coursesEnrolled: courses.length,
    averageProgress: courses.length
      ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
      : 0,
    lecturesCompleted,
    lecturesTotal,
    tasksCompleted,
    tasksTotal,
    averageAttendance: attendancePercentages.length
      ? Math.round(attendancePercentages.reduce((a, b) => a + b, 0) / attendancePercentages.length)
      : null,
  };

  return NextResponse.json({ summary, courses });
}
