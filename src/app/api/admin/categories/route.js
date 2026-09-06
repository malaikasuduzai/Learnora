import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { courseCategorySchema, flattenZodError } from "@/lib/validations";
import { slugify } from "@/lib/slug";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

export async function GET() {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const categories = await prisma.courseCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(request) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

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

  const existing = await prisma.courseCategory.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { name: "A category with this name already exists" } },
      { status: 409 }
    );
  }

  const category = await prisma.courseCategory.create({
    data: { name, slug, description: description || null },
  });

  return NextResponse.json({ category }, { status: 201 });
}
