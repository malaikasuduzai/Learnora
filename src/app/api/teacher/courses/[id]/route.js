import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/teacher/courses/:id — a single assigned course plus its full
// content tree, for the course content management screen.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findFirst({
    where: { id: params.id, teacherId: user.id },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      status: true,
      level: true,
      duration: true,
      category: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  return NextResponse.json({ course });
}
