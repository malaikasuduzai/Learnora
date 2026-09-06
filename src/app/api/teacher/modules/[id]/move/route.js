import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { moveSchema, flattenZodError } from "@/lib/validations";

// POST /api/teacher/modules/:id/move — swaps this module's `order` with its
// immediate neighbor in the same course, giving the teacher simple
// up/down reordering without a drag-and-drop library.
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const current = await prisma.module.findFirst({
    where: { id: params.id, course: { teacherId: user.id } },
  });
  if (!current) return NextResponse.json({ error: "Module not found" }, { status: 404 });

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

  const neighbor = await prisma.module.findFirst({
    where: {
      courseId: current.courseId,
      order: parsed.data.direction === "up" ? { lt: current.order } : { gt: current.order },
    },
    orderBy: { order: parsed.data.direction === "up" ? "desc" : "asc" },
  });

  if (!neighbor) {
    // Already at the top/bottom — nothing to do, not an error.
    return NextResponse.json({ success: true });
  }

  await prisma.$transaction([
    prisma.module.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.module.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  return NextResponse.json({ success: true });
}
