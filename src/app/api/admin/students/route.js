import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { createStudentSchema, flattenZodError } from "@/lib/validations";
import { notifyUser, notifyRoles } from "@/lib/notify";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

const STUDENT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  isActive: true,
  createdAt: true,
  _count: { select: { enrollments: true } },
};

// GET /api/admin/students?search=&excludeCourseId=
// Powers both the Students management table and the "Enroll student" picker
// on a course's detail page. When excludeCourseId is given, students already
// enrolled in that course are left out so the picker only shows who can
// still be added.
export async function GET(request) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const excludeCourseId = searchParams.get("excludeCourseId")?.trim();
  const isPicker = searchParams.has("excludeCourseId");

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(search
        ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
        : {}),
      ...(excludeCourseId
        ? { enrollments: { none: { courseId: excludeCourseId } } }
        : {}),
    },
    orderBy: isPicker ? { name: "asc" } : { createdAt: "desc" },
    take: isPicker ? 25 : undefined,
    select: isPicker
      ? { id: true, name: true, email: true, isActive: true }
      : STUDENT_SELECT,
  });

  return NextResponse.json({ students });
}

// POST /api/admin/students — Admin/Super Admin creates a Student account
// directly (the PRD's "Add Student"), separate from public self-registration.
export async function POST(request) {
  const { user, error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { email: "An account with this email already exists" } },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(password);

  const student = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "STUDENT",
    },
    select: STUDENT_SELECT,
  });

  await Promise.all([
    notifyUser({
      userId: student.id, type: "ANNOUNCEMENT",
      title: "Your Learnora Student account is ready",
      body: "You can now sign in, browse courses and start learning.", link: "/student",
    }),
    notifyRoles(["SUPER_ADMIN"], {
      type: "ANNOUNCEMENT", title: "New Student account created",
      body: `${student.name} was added by ${user.name}.`, link: "/super-admin/students",
    }),
  ]);

  return NextResponse.json({ student }, { status: 201 });
}
