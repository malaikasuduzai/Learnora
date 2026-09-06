import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/super-admin/stats — live platform-wide headline numbers for the
// Super Admin overview. Kept separate and lighter than
// /api/super-admin/reports (which builds a full per-course breakdown) since
// the dashboard home only needs top-line counts and a short activity feed.
export async function GET() {
  const { error } = await requireRole(["SUPER_ADMIN"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const [
    totalAdmins,
    totalTeachers,
    totalStudents,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    recentAccounts,
    recentCourses,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "TEACHER"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        teacher: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalAdmins,
      totalTeachers,
      totalStudents,
      totalCourses,
      publishedCourses,
      totalEnrollments,
    },
    recentAccounts,
    recentCourses,
  });
}
