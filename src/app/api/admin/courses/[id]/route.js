import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { courseSchema, flattenZodError } from "@/lib/validations";
import { notifyUser, notifyRoles } from "@/lib/notify";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

const courseDetailSelect = {
  id: true,
  title: true,
  description: true,
  thumbnail: true,
  duration: true,
  level: true,
  objectives: true,
  requirements: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  teacherId: true,
  teacher: { select: { id: true, name: true, email: true } },
};

export async function GET(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: courseDetailSelect,
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await prisma.course.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const category = await prisma.courseCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { categoryId: "Choose a valid category" } },
      { status: 422 }
    );
  }

  if (data.teacherId) {
    const teacher = await prisma.user.findUnique({ where: { id: data.teacherId } });
    if (!teacher || teacher.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: { teacherId: "Choose a valid teacher" } },
        { status: 422 }
      );
    }
  }

  const course = await prisma.course.update({
    where: { id: params.id },
    data: {
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail || null,
      categoryId: data.categoryId,
      duration: data.duration,
      level: data.level,
      objectives: data.objectives || null,
      requirements: data.requirements || null,
      status: data.status,
      teacherId: data.teacherId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    select: courseDetailSelect,
  });

  const notifications = [
    notifyRoles(["SUPER_ADMIN"], {
      type: "ANNOUNCEMENT", title: "Course updated",
      body: `${course.title} was updated by ${user.name}.`, link: "/super-admin/courses",
    }),
  ];
  if (course.teacherId) {
    notifications.push(notifyUser({
      userId: course.teacherId, type: "ANNOUNCEMENT", title: `Course updated: ${course.title}`,
      body: "Course details or publishing status changed. Please review your course.", link: "/teacher/courses",
    }));
  }
  await Promise.all(notifications);

  return NextResponse.json({ course });
}

export async function DELETE(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await prisma.course.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
