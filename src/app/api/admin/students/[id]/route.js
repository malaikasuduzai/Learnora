import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { updateStudentSchema, flattenZodError } from "@/lib/validations";

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

// GET /api/admin/students/:id — student detail incl. enrolled courses
// ("View Student"; also covers "View Enrolled Courses").
export async function GET(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const student = await prisma.user.findFirst({
    where: { id: params.id, role: "STUDENT" },
    select: {
      ...STUDENT_SELECT,
      enrollments: {
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          course: { select: { id: true, title: true, status: true } },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ student });
}

// PATCH /api/admin/students/:id — "Edit Student" and
// "Activate/Deactivate Student" share one endpoint since both are just a
// partial update of the same record.
export async function PATCH(request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const existing = await prisma.user.findFirst({ where: { id: params.id, role: "STUDENT" } });
  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const { name, phone, bio, isActive } = parsed.data;

  const student = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: STUDENT_SELECT,
  });

  return NextResponse.json({ student });
}

// DELETE /api/admin/students/:id — "Delete Student". Cascades their
// enrollments (see Enrollment.studentId onDelete: Cascade in schema.prisma).
export async function DELETE(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await prisma.user.findFirst({ where: { id: params.id, role: "STUDENT" } });
  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
