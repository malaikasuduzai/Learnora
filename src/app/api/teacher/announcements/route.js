import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { announcementSchema, flattenZodError } from "@/lib/validations";
import { notifyUsers } from "@/lib/notify";

// GET /api/teacher/announcements — every announcement the teacher has
// published, across their own courses, newest first (PRD section 29).
export async function GET() {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const announcements = await prisma.announcement.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { id: true, title: true } } },
  });

  return NextResponse.json({ announcements });
}

// POST /api/teacher/announcements — "Teachers should be able to publish
// announcements for their courses" (PRD section 29). Only one of the
// teacher's own courses can be targeted, and every currently enrolled
// student is notified the moment it's published.
export async function POST(request) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const course = await prisma.course.findFirst({
    where: { id: data.courseId, teacherId: user.id },
    select: { id: true, title: true },
  });
  if (!course) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { courseId: "Choose one of your assigned courses" } },
      { status: 422 }
    );
  }

  const announcement = await prisma.announcement.create({
    data: { courseId: course.id, teacherId: user.id, title: data.title, body: data.body },
    include: { course: { select: { id: true, title: true } } },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    select: { studentId: true },
  });
  await notifyUsers(
    enrollments.map((e) => e.studentId),
    {
      type: "ANNOUNCEMENT",
      title: `New announcement in ${course.title}`,
      body: data.title,
      link: "/student/announcements",
    }
  );

  return NextResponse.json({ announcement }, { status: 201 });
}
