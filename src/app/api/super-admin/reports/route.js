import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures } from "@/lib/courseContent";
import { attendancePercent } from "@/lib/attendanceDisplay";

// GET /api/super-admin/reports — platform-wide reporting: full visibility
// into every admin/teacher/student, course, enrollment, task and
// attendance record rolling up to the Super Admin, per the PRD's Super
// Admin permission matrix ("Full visibility into every course, enrollment
// and report"). Nothing here is stored — like course/lecture progress,
// task status and attendance percentage elsewhere in this build, every
// number is derived at read time from the same rows Days 3-7 already
// write, so a report can never drift out of sync with the underlying data.
export async function GET() {
  const { error } = await requireRole(["SUPER_ADMIN"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const [userCounts, courses, tasks, lectureProgressRows, attendanceRows, submissions] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        teacher: { select: { id: true, name: true } },
        category: { select: { name: true } },
        modules: { select: { lectures: { select: { id: true } } } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.task.findMany({
      select: {
        id: true,
        courseId: true,
        status: true,
        maxMarks: true,
        _count: { select: { assignments: true } },
      },
    }),
    prisma.lectureProgress.findMany({
      select: { lecture: { select: { module: { select: { courseId: true } } } } },
    }),
    prisma.attendance.findMany({ select: { courseId: true, status: true } }),
    prisma.taskSubmission.findMany({ select: { taskId: true, status: true, marks: true } }),
  ]);

  const roleCounts = Object.fromEntries(userCounts.map((r) => [r.role, r._count._all]));

  const completedLecturesByCourse = new Map();
  for (const row of lectureProgressRows) {
    const courseId = row.lecture.module.courseId;
    completedLecturesByCourse.set(courseId, (completedLecturesByCourse.get(courseId) ?? 0) + 1);
  }

  const attendanceByCourse = new Map();
  for (const row of attendanceRows) {
    if (!attendanceByCourse.has(row.courseId)) attendanceByCourse.set(row.courseId, []);
    attendanceByCourse.get(row.courseId).push(row);
  }

  const tasksByCourse = new Map();
  for (const task of tasks) {
    if (!tasksByCourse.has(task.courseId)) tasksByCourse.set(task.courseId, []);
    tasksByCourse.get(task.courseId).push(task);
  }

  const submissionsByTask = new Map();
  for (const submission of submissions) {
    if (!submissionsByTask.has(submission.taskId)) submissionsByTask.set(submission.taskId, []);
    submissionsByTask.get(submission.taskId).push(submission);
  }

  let maxPossibleLecturesAll = 0;
  let completedLecturesAll = 0;

  const courseReports = courses.map((course) => {
    const totalLectures = flattenLectures(course.modules).length;
    const enrolled = course._count.enrollments;
    const completedLectures = completedLecturesByCourse.get(course.id) ?? 0;
    // completedLectures counts every (student, lecture) completion in the
    // course, so it's compared against totalLectures * enrolled — the
    // maximum possible completions — for a fair 0-100 average across
    // every enrolled student, not just one.
    const maxPossible = totalLectures * enrolled;
    const avgProgress = maxPossible > 0 ? Math.round((completedLectures / maxPossible) * 100) : 0;
    maxPossibleLecturesAll += maxPossible;
    completedLecturesAll += completedLectures;

    const attendanceRecords = attendanceByCourse.get(course.id) ?? [];
    const avgAttendance = attendanceRecords.length ? attendancePercent(attendanceRecords) : null;

    const courseTasks = tasksByCourse.get(course.id) ?? [];
    let assignedTotal = 0;
    let completedTotal = 0;
    let normalizedScoreSum = 0;
    let scoredCount = 0;
    for (const task of courseTasks) {
      assignedTotal += task._count.assignments;
      const taskSubmissions = submissionsByTask.get(task.id) ?? [];
      for (const submission of taskSubmissions) {
        if (submission.status === "COMPLETED") {
          completedTotal += 1;
          if (submission.marks != null && task.maxMarks > 0) {
            normalizedScoreSum += (submission.marks / task.maxMarks) * 100;
            scoredCount += 1;
          }
        }
      }
    }

    return {
      id: course.id,
      title: course.title,
      status: course.status,
      teacherName: course.teacher?.name ?? null,
      categoryName: course.category?.name ?? null,
      enrolledCount: enrolled,
      totalTasks: courseTasks.length,
      avgProgress,
      avgAttendance,
      taskCompletionRate: assignedTotal > 0 ? Math.round((completedTotal / assignedTotal) * 100) : null,
      avgScore: scoredCount > 0 ? Math.round(normalizedScoreSum / scoredCount) : null,
    };
  });

  const attendanceValues = courseReports.filter((c) => c.avgAttendance != null).map((c) => c.avgAttendance);

  const summary = {
    totalAdmins: roleCounts.ADMIN ?? 0,
    totalTeachers: roleCounts.TEACHER ?? 0,
    totalStudents: roleCounts.STUDENT ?? 0,
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === "PUBLISHED").length,
    totalEnrollments: courses.reduce((sum, c) => sum + c._count.enrollments, 0),
    totalTasks: tasks.length,
    publishedTasks: tasks.filter((t) => t.status === "PUBLISHED").length,
    totalSubmissions: submissions.length,
    completedSubmissions: submissions.filter((s) => s.status === "COMPLETED").length,
    avgLectureCompletion:
      maxPossibleLecturesAll > 0 ? Math.round((completedLecturesAll / maxPossibleLecturesAll) * 100) : 0,
    avgAttendance: attendanceValues.length
      ? Math.round(attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length)
      : null,
  };

  return NextResponse.json({ summary, courses: courseReports });
}
