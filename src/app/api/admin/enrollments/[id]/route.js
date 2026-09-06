import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

// DELETE /api/admin/enrollments/:id — remove a student from a course.
export async function DELETE(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await prisma.enrollment.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  await prisma.enrollment.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
