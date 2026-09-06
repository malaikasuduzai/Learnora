import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/student/courses/available — "Browse Course" (PRD section 10:
// "Browse Course -> View Course Details -> Enroll -> Enrollment
// Confirmation -> Course Appears in My Courses"). Only PUBLISHED courses
// the student isn't already enrolled in are returned, with optional
// search-by-title and category filters (PRD section 32).
export async function GET(request) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const categoryId = searchParams.get("categoryId")?.trim();

  const enrolledIds = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });
  const excludeIds = enrolledIds.map((e) => e.courseId);

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: excludeIds },
      ...(search ? { title: { contains: search } } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      duration: true,
      level: true,
      objectives: true,
      requirements: true,
      startDate: true,
      endDate: true,
      category: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      modules: {
        select: { lectures: { select: { id: true } } },
      },
      _count: { select: { enrollments: true } },
    },
  });

  const result = courses.map((course) => {
    const lectureCount = course.modules.reduce((sum, m) => sum + m.lectures.length, 0);
    const { modules, _count, ...rest } = course;
    return { ...rest, lectureCount, enrolledCount: _count.enrollments };
  });

  return NextResponse.json({ courses: result });
}
