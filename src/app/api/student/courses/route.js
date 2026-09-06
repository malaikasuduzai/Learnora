import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures, courseProgressPercent } from "@/lib/courseContent";

// GET /api/student/courses — "My Courses" (PRD section 12): every course
// this student is enrolled in, with a lecture-based progress percentage.
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
          duration: true,
          level: true,
          status: true,
          teacher: { select: { id: true, name: true } },
          modules: {
            select: {
              id: true,
              order: true,
              lectures: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  const courseIds = enrollments.map((e) => e.course.id);
  const progressRows = await prisma.lectureProgress.findMany({
    where: {
      studentId: user.id,
      lecture: { module: { courseId: { in: courseIds } } },
    },
    select: { lectureId: true, lecture: { select: { module: { select: { courseId: true } } } } },
  });

  const completedByCourse = new Map();
  for (const row of progressRows) {
    const courseId = row.lecture.module.courseId;
    completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1);
  }

  const courses = enrollments.map((enrollment) => {
    const flat = flattenLectures(
      enrollment.course.modules.map((m) => ({ ...m, lectures: m.lectures }))
    );
    const totalLectures = flat.length;
    const completedCount = completedByCourse.get(enrollment.course.id) ?? 0;

    return {
      enrollmentId: enrollment.id,
      enrollmentStatus: enrollment.status,
      id: enrollment.course.id,
      title: enrollment.course.title,
      thumbnail: enrollment.course.thumbnail,
      duration: enrollment.course.duration,
      level: enrollment.course.level,
      status: enrollment.course.status,
      teacher: enrollment.course.teacher,
      totalLectures,
      completedLectures: completedCount,
      progress: courseProgressPercent(totalLectures, completedCount),
    };
  });

  return NextResponse.json({ courses });
}
