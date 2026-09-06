import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { lectureSchema, flattenZodError } from "@/lib/validations";

async function loadOwnedLecture(lectureId, teacherId) {
  return prisma.lecture.findFirst({
    where: { id: lectureId, module: { course: { teacherId } } },
  });
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await loadOwnedLecture(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

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

  const lecture = await prisma.lecture.update({
    where: { id: params.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      videoUrl: parsed.data.videoUrl || null,
      notes: parsed.data.notes || null,
      duration: parsed.data.duration || null,
    },
    include: { resources: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ lecture });
}

// DELETE cascades to the lecture's resources and any students' progress
// rows for it.
export async function DELETE(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await loadOwnedLecture(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  await prisma.lecture.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
