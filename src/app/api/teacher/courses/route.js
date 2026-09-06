import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/teacher/courses — "Once assigned, the teacher should automatically
// receive access to manage that course" (PRD section 7). Full course
// management (modules, lectures, tasks) is Day 4+; for now the teacher can
// see which courses they've been assigned and how many students are enrolled.
export async function GET() {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      level: true,
      status: true,
      duration: true,
      startDate: true,
      endDate: true,
      category: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json({ courses });
}
