import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// DELETE /api/teacher/announcements/:id — retract an announcement the
// teacher published on one of their own courses.
export async function DELETE(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const announcement = await prisma.announcement.findFirst({
    where: { id: params.id, teacherId: user.id },
  });
  if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

  await prisma.announcement.delete({ where: { id: announcement.id } });
  return NextResponse.json({ ok: true });
}
