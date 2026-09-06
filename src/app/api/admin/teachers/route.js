import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { createTeacherSchema, flattenZodError } from "@/lib/validations";
import { notifyUser, notifyRoles } from "@/lib/notify";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

const TEACHER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  isActive: true,
  createdAt: true,
  _count: { select: { coursesTaught: true } },
};

// GET /api/admin/teachers?search=ali — powers both the Teachers management
// table and the "Assigned teacher" dropdown on the course form.
export async function GET(request) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: TEACHER_SELECT,
  });

  return NextResponse.json({ teachers });
}

// POST /api/admin/teachers — Admin/Super Admin creates a Teacher account
// directly (the PRD's "Add Teacher"), separate from public self-registration.
export async function POST(request) {
  const { user, error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createTeacherSchema.safeParse(body);
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

  const teacher = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "TEACHER",
    },
    select: TEACHER_SELECT,
  });

  await Promise.all([
    notifyUser({
      userId: teacher.id, type: "ANNOUNCEMENT",
      title: "Your Learnora Teacher account is ready",
      body: "You can now sign in and manage your assigned courses.", link: "/teacher",
    }),
    notifyRoles(["SUPER_ADMIN"], {
      type: "ANNOUNCEMENT", title: "New Teacher account created",
      body: `${teacher.name} was added by ${user.name}.`, link: "/super-admin/teachers",
    }),
  ]);

  return NextResponse.json({ teacher }, { status: 201 });
}
