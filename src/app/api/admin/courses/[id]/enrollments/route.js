import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enrollStudentSchema, flattenZodError } from "@/lib/validations";
import { notifyUser } from "@/lib/notify";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

// POST /api/admin/courses/:id/enrollments — "The Admin should also be able
// to manually enroll a student into a course" (PRD section 10).
export async function POST(request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = enrollStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const student = await prisma.user.findFirst({
    where: { id: parsed.data.studentId, role: "STUDENT" },
  });
  if (!student) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { studentId: "Choose a valid student" } },
      { status: 422 }
    );
  }

  const alreadyEnrolled = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
  });
  if (alreadyEnrolled) {
    return NextResponse.json(
      { error: "This student is already enrolled in this course." },
      { status: 409 }
    );
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId: student.id, courseId: course.id },
    select: {
      id: true,
      status: true,
      enrolledAt: true,
      student: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyUser({
    userId: student.id,
    type: "ENROLLMENT",
    title: `You've been enrolled in ${course.title}`,
    body: "It now appears under My courses.",
    link: "/student/courses",
  });

  return NextResponse.json({ enrollment }, { status: 201 });
}

// GET /api/admin/courses/:id/enrollments — list students enrolled in a course.
export async function GET(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: params.id },
    orderBy: { enrolledAt: "desc" },
    select: {
      id: true,
      status: true,
      enrolledAt: true,
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ enrollments });
}
