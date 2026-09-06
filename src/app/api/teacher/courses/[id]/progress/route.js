import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures, courseProgressPercent } from "@/lib/courseContent";

// GET /api/teacher/courses/:id/progress — "Monitor Student Progress" (PRD
// section 27): every enrolled student's lecture completion for this course,
// so the teacher can see who's ahead and who's stalled without opening
// each student individually.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findFirst({
    where: { id: params.id, teacherId: user.id },
    select: {
      id: true,
      modules: { select: { id: true, order: true, lectures: { select: { id: true } } } },
      enrollments: {
        orderBy: { enrolledAt: "asc" },
        select: { id: true, student: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const flat = flattenLectures(course.modules);
  const totalLectures = flat.length;
  const lectureIds = flat.map((l) => l.id);
  const studentIds = course.enrollments.map((e) => e.student.id);

  const progressRows = totalLectures
    ? await prisma.lectureProgress.findMany({
        where: { lectureId: { in: lectureIds }, studentId: { in: studentIds } },
        select: { studentId: true },
      })
    : [];

  const completedByStudent = new Map();
  for (const row of progressRows) {
    completedByStudent.set(row.studentId, (completedByStudent.get(row.studentId) ?? 0) + 1);
  }

  const students = course.enrollments.map((enrollment) => {
    const completed = completedByStudent.get(enrollment.student.id) ?? 0;
    return {
      enrollmentId: enrollment.id,
      student: enrollment.student,
      completedLectures: completed,
      totalLectures,
      progress: courseProgressPercent(totalLectures, completed),
    };
  });

  return NextResponse.json({ students, totalLectures });
}
