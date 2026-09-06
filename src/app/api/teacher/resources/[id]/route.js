import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function DELETE(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const resource = await prisma.lectureResource.findFirst({
    where: { id: params.id, lecture: { module: { course: { teacherId: user.id } } } },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  await prisma.lectureResource.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
