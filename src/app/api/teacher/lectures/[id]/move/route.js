import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { moveSchema, flattenZodError } from "@/lib/validations";

// Reorders a lecture within its own module only (moving a lecture between
// modules isn't supported yet — the teacher can delete and re-add it in
// the target module if needed).
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const current = await prisma.lecture.findFirst({
    where: { id: params.id, module: { course: { teacherId: user.id } } },
  });
  if (!current) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const neighbor = await prisma.lecture.findFirst({
    where: {
      moduleId: current.moduleId,
      order: parsed.data.direction === "up" ? { lt: current.order } : { gt: current.order },
    },
    orderBy: { order: parsed.data.direction === "up" ? "desc" : "asc" },
  });

  if (!neighbor) {
    return NextResponse.json({ success: true });
  }

  await prisma.$transaction([
    prisma.lecture.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.lecture.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  return NextResponse.json({ success: true });
}
