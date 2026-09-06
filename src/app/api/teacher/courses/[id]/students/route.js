import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/teacher/courses/:id/students — the enrolled-student list used to
// pick "Assigned Students" when creating or editing a task (PRD section
// 14). Only ever the students actually enrolled in a course this teacher
// owns, same ownership guard as the rest of the Day 4/5 teacher routes.
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

  return NextResponse.json({ students: enrollments.map((e) => e.student) });
}
