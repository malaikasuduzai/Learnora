import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { moduleSchema, flattenZodError } from "@/lib/validations";

// A teacher only ever manages modules/lectures on courses an Admin has
// assigned them to ("The teacher should only be able to manage courses
// assigned to them", PRD section 7) — every route in this slice re-checks
// that ownership rather than trusting the id in the URL.
async function loadOwnedCourse(courseId, teacherId) {
  return prisma.course.findFirst({ where: { id: courseId, teacherId } });
}

// GET /api/teacher/courses/:id/modules — modules with their lectures and
// resources, in display order, for the course content management screen.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadOwnedCourse(params.id, user.id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const modules = await prisma.module.findMany({
    where: { courseId: course.id },
    orderBy: { order: "asc" },
    include: {
      lectures: {
        orderBy: { order: "asc" },
        include: { resources: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  return NextResponse.json({ modules });
}

// POST /api/teacher/courses/:id/modules — "The teacher should be able to
// create and organize modules and lectures" (PRD section 8). New modules
// are appended to the end of the course's order.
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadOwnedCourse(params.id, user.id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = moduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const last = await prisma.module.findFirst({
    where: { courseId: course.id },
    orderBy: { order: "desc" },
  });

  const mod = await prisma.module.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      order: (last?.order ?? -1) + 1,
    },
    include: { lectures: { orderBy: { order: "asc" }, include: { resources: true } } },
  });

  return NextResponse.json({ module: mod }, { status: 201 });
}
