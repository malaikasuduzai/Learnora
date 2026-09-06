import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { moduleSchema, flattenZodError } from "@/lib/validations";

async function loadOwnedModule(moduleId, teacherId) {
  return prisma.module.findFirst({
    where: { id: moduleId, course: { teacherId } },
    include: { course: { select: { id: true, teacherId: true } } },
  });
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await loadOwnedModule(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Module not found" }, { status: 404 });

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

  const mod = await prisma.module.update({
    where: { id: params.id },
    data: { title: parsed.data.title, description: parsed.data.description || null },
    include: { lectures: { orderBy: { order: "asc" }, include: { resources: true } } },
  });

  return NextResponse.json({ module: mod });
}

// DELETE removes the module and (via onDelete: Cascade) every lecture,
// resource and student progress row underneath it — confirmed client-side
// before this is called.
export async function DELETE(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await loadOwnedModule(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  await prisma.module.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
