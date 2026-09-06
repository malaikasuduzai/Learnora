import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { courseSchema, flattenZodError } from "@/lib/validations";
import { notifyUser, notifyRoles } from "@/lib/notify";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

const courseListSelect = {
  id: true,
  title: true,
  thumbnail: true,
  duration: true,
  level: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true } },
};

export async function GET(request) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const categoryId = searchParams.get("categoryId")?.trim();
  const status = searchParams.get("status")?.trim();

  const where = {
    ...(search ? { title: { contains: search } } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
  };

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: courseListSelect,
  });

  return NextResponse.json({ courses });
}

export async function POST(request) {
  const { user, error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

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

  const course = await prisma.course.create({
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
    select: courseListSelect,
  });

  const notifications = [
    notifyRoles(["SUPER_ADMIN"], {
      type: "ANNOUNCEMENT", title: "New course created",
      body: `${course.title} was created by ${user.name}.`, link: "/super-admin/courses",
    }),
    notifyUser({
      userId: user.id, type: "ANNOUNCEMENT", title: "Course created successfully",
      body: `${course.title} is now in the course management area.`, link: "/admin/courses",
    }),
  ];
  if (course.teacher?.id) {
    notifications.push(notifyUser({
      userId: course.teacher.id, type: "ANNOUNCEMENT", title: `You've been assigned to ${course.title}`,
      body: "Open My courses to start preparing the course content.", link: "/teacher/courses",
    }));
  }
  await Promise.all(notifications);

  return NextResponse.json({ course }, { status: 201 });
}
