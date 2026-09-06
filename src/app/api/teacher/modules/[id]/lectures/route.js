import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { lectureSchema, flattenZodError } from "@/lib/validations";
import { notifyUsers } from "@/lib/notify";

// POST /api/teacher/modules/:id/lectures — "Teachers should be able to add
// course lectures" (PRD section 9). Appended to the end of the module.
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const mod = await prisma.module.findFirst({
    where: { id: params.id, course: { teacherId: user.id } },
    include: { course: { select: { id: true, title: true } } },
  });
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = lectureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const last = await prisma.lecture.findFirst({
    where: { moduleId: mod.id },
    orderBy: { order: "desc" },
  });

  const lecture = await prisma.lecture.create({
    data: {
      moduleId: mod.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      videoUrl: parsed.data.videoUrl || null,
      notes: parsed.data.notes || null,
      duration: parsed.data.duration || null,
      order: (last?.order ?? -1) + 1,
    },
    include: { resources: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: mod.course.id },
    select: { studentId: true },
  });
  await notifyUsers(
    enrollments.map((e) => e.studentId),
    {
      type: "LECTURE_ADDED",
      title: `New lecture in ${mod.course.title}`,
      body: lecture.title,
      link: `/student/courses/${mod.course.id}`,
    }
  );

  return NextResponse.json({ lecture }, { status: 201 });
}
