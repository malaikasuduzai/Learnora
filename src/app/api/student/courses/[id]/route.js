import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures, computeLectureStatuses, courseProgressPercent } from "@/lib/courseContent";

// GET /api/student/courses/:id — course details plus every module/lecture
// annotated with this student's completed/in-progress/locked status
// (PRD sections 13 & 25). Only accessible if the student is enrolled.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId: params.id } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "You are not enrolled in this course." }, { status: 403 });
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      duration: true,
      level: true,
      status: true,
      teacher: { select: { id: true, name: true, email: true } },
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          lectures: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              videoUrl: true,
              notes: true,
              duration: true,
              order: true,
              resources: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const flat = flattenLectures(course.modules);
  const completedRows = await prisma.lectureProgress.findMany({
    where: { studentId: user.id, lectureId: { in: flat.map((l) => l.id) } },
    select: { lectureId: true, completedAt: true },
  });
  const completedIds = new Set(completedRows.map((r) => r.lectureId));
  const completedAtById = new Map(completedRows.map((r) => [r.lectureId, r.completedAt]));
  const statuses = computeLectureStatuses(flat, completedIds);

  const modules = course.modules.map((mod) => ({
    ...mod,
    lectures: mod.lectures.map((lecture) => ({
      ...lecture,
      status: statuses.get(lecture.id) ?? "locked",
      completedAt: completedAtById.get(lecture.id) ?? null,
    })),
  }));

  return NextResponse.json({
    course: { ...course, modules },
    progress: courseProgressPercent(flat.length, completedIds.size),
    totalLectures: flat.length,
    completedLectures: completedIds.size,
  });
}
