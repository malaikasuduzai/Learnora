import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/student/announcements — every announcement published on any
// course this student is enrolled in, newest first.
export async function GET() {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const announcements = courseIds.length
    ? await prisma.announcement.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true } },
          teacher: { select: { id: true, name: true } },
        },
      })
    : [];

  return NextResponse.json({ announcements });
}
