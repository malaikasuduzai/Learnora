import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { resourceSchema, flattenZodError } from "@/lib/validations";

// POST /api/teacher/lectures/:id/resources — "Add Resources" (PRD sections
// 9 & 27): notes, slides, or any reference link attached to a lecture.
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const lecture = await prisma.lecture.findFirst({
    where: { id: params.id, module: { course: { teacherId: user.id } } },
  });
  if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const resource = await prisma.lectureResource.create({
    data: {
      lectureId: lecture.id,
      title: parsed.data.title,
      url: parsed.data.url,
      type: parsed.data.type,
    },
  });

  return NextResponse.json({ resource }, { status: 201 });
}
