import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { courseCategorySchema, flattenZodError } from "@/lib/validations";
import { slugify } from "@/lib/slug";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

export async function PATCH(request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const category = await prisma.courseCategory.findUnique({ where: { id: params.id } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = courseCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { name, description } = parsed.data;
  const slug = slugify(name);

  const conflict = await prisma.courseCategory.findFirst({
    where: { id: { not: params.id }, OR: [{ name }, { slug }] },
  });
  if (conflict) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { name: "A category with this name already exists" } },
      { status: 409 }
    );
  }

  const updated = await prisma.courseCategory.update({
    where: { id: params.id },
    data: { name, slug, description: description || null },
  });

  return NextResponse.json({ category: updated });
}

export async function DELETE(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const category = await prisma.courseCategory.findUnique({
    where: { id: params.id },
    include: { _count: { select: { courses: true } } },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  if (category._count.courses > 0) {
    return NextResponse.json(
      { error: `This category has ${category._count.courses} course(s) assigned to it. Move or delete those courses first.` },
      { status: 409 }
    );
  }

  await prisma.courseCategory.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
