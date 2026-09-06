import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updateTeacherSchema, flattenZodError } from "@/lib/validations";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

const TEACHER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  isActive: true,
  createdAt: true,
  coursesTaught: {
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: "desc" },
  },
};

// GET /api/admin/teachers/:id — teacher detail incl. assigned courses
// ("View Teacher"; "View Assigned Students" is derived client-side from this).
export async function GET(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const teacher = await prisma.user.findFirst({
    where: { id: params.id, role: "TEACHER" },
    select: TEACHER_SELECT,
  });

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json({ teacher });
}

// PATCH /api/admin/teachers/:id — "Edit Teacher" and
// "Activate/Deactivate Teacher" from the PRD share one endpoint since both
// are just a partial update of the same record.
export async function PATCH(request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateTeacherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const existing = await prisma.user.findFirst({ where: { id: params.id, role: "TEACHER" } });
  if (!existing) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const { name, phone, bio, isActive } = parsed.data;

  const teacher = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: TEACHER_SELECT,
  });

  return NextResponse.json({ teacher });
}
