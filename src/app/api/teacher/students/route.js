import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures, courseProgressPercent } from "@/lib/courseContent";
import { attendancePercent } from "@/lib/attendanceDisplay";

// GET /api/teacher/students — every student enrolled in one of this
// teacher's own courses, each with a per-course breakdown of lecture
// progress, task completion and attendance. This is the Teacher-side
// counterpart to the Student's own /api/student/progress: same
// derive-don't-store approach (nothing here is a stored total, it's all
// assembled at read time from the LectureProgress, TaskAssignment/
// TaskSubmission and Attendance rows Days 4, 5 and 7 already write), just
// rolled up across every student in every course this teacher teaches
// instead of one student's own enrollments.
export async function GET() {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      modules: { select: { lectures: { select: { id: true } } } },
      enrollments: {
        orderBy: { student: { name: "asc" } },
        select: {
          student: { select: { id: true, name: true, email: true, isActive: true } },
        },
      },
    },
  });

  const courseIds = courses.map((c) => c.id);
  const studentIds = [...new Set(courses.flatMap((c) => c.enrollments.map((e) => e.student.id)))];

  const [lectureProgress, taskAssignments, taskSubmissions, attendanceRows] = await Promise.all([
    courseIds.length
      ? prisma.lectureProgress.findMany({
          where: { studentId: { in: studentIds }, lecture: { module: { courseId: { in: courseIds } } } },
          select: { studentId: true, lecture: { select: { module: { select: { courseId: true } } } } },
        })
      : [],
    courseIds.length
      ? prisma.taskAssignment.findMany({
          where: { studentId: { in: studentIds }, task: { courseId: { in: courseIds } } },
          select: { studentId: true, task: { select: { id: true, courseId: true } } },
        })
      : [],
    studentIds.length
      ? prisma.taskSubmission.findMany({
          where: { studentId: { in: studentIds } },
          select: { studentId: true, taskId: true, status: true },
        })
      : [],
    courseIds.length
      ? prisma.attendance.findMany({
          where: { studentId: { in: studentIds }, courseId: { in: courseIds } },
          select: { studentId: true, courseId: true, status: true },
        })
      : [],
  ]);

  const completedByStudentCourse = new Map();
  for (const row of lectureProgress) {
    const key = `${row.studentId}:${row.lecture.module.courseId}`;
    completedByStudentCourse.set(key, (completedByStudentCourse.get(key) ?? 0) + 1);
  }

  const assignedTaskIdsByStudentCourse = new Map();
  for (const a of taskAssignments) {
    const key = `${a.studentId}:${a.task.courseId}`;
    if (!assignedTaskIdsByStudentCourse.has(key)) assignedTaskIdsByStudentCourse.set(key, []);
    assignedTaskIdsByStudentCourse.get(key).push(a.task.id);
  }

  const submissionStatusByStudentTask = new Map();
  for (const s of taskSubmissions) {
    submissionStatusByStudentTask.set(`${s.studentId}:${s.taskId}`, s.status);
  }

  const attendanceByStudentCourse = new Map();
  for (const row of attendanceRows) {
    const key = `${row.studentId}:${row.courseId}`;
    if (!attendanceByStudentCourse.has(key)) attendanceByStudentCourse.set(key, []);
    attendanceByStudentCourse.get(key).push(row);
  }

  const byStudent = new Map();

  for (const course of courses) {
    const totalLectures = flattenLectures(course.modules).length;

    for (const { student } of course.enrollments) {
      const key = `${student.id}:${course.id}`;
      const completedLectures = completedByStudentCourse.get(key) ?? 0;
      const taskIds = assignedTaskIdsByStudentCourse.get(key) ?? [];
      const tasksCompleted = taskIds.filter(
        (taskId) => submissionStatusByStudentTask.get(`${student.id}:${taskId}`) === "COMPLETED"
      ).length;
      const attendanceRecords = attendanceByStudentCourse.get(key) ?? [];

      const courseEntry = {
        courseId: course.id,
        courseTitle: course.title,
        progress: courseProgressPercent(totalLectures, completedLectures),
        completedLectures,
        totalLectures,
        tasksCompleted,
        tasksTotal: taskIds.length,
        attendancePercent: attendanceRecords.length ? attendancePercent(attendanceRecords) : null,
      };

      if (!byStudent.has(student.id)) {
        byStudent.set(student.id, { student, courses: [] });
      }
      byStudent.get(student.id).courses.push(courseEntry);
    }
  }

  const students = [...byStudent.values()]
    .map((entry) => ({
      ...entry,
      overallProgress: entry.courses.length
        ? Math.round(entry.courses.reduce((sum, c) => sum + c.progress, 0) / entry.courses.length)
        : 0,
    }))
    .sort((a, b) => a.student.name.localeCompare(b.student.name));

  return NextResponse.json({
    students,
    courses: courses.map((c) => ({ id: c.id, title: c.title })),
  });
}
