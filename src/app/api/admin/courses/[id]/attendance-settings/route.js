import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { attendanceSettingsSchema, flattenZodError } from "@/lib/validations";

const CAN_MANAGE_COURSES = ["SUPER_ADMIN", "ADMIN"];

// GET /api/admin/courses/:id/attendance-settings — the current window for
// one course, used to prefill the settings form.
export async function GET(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      attendanceWindowStart: true,
      attendanceWindowEnd: true,
      lateAllowed: true,
    },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  return NextResponse.json({ course });
}

// PATCH /api/admin/courses/:id/attendance-settings — "Teachers/Admins should
// be able to define attendance settings for each course" (PRD section 19).
// Scoped to its own endpoint rather than folded into the general course
// PATCH so a single small form can update it without resubmitting the rest
// of the course record.
export async function PATCH(request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_COURSES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await prisma.course.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = attendanceSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const course = await prisma.course.update({
    where: { id: params.id },
    data: {
      attendanceWindowStart: data.attendanceWindowStart,
      attendanceWindowEnd: data.attendanceWindowEnd,
      lateAllowed: data.lateAllowed,
    },
    select: {
      id: true,
      title: true,
      attendanceWindowStart: true,
      attendanceWindowEnd: true,
      lateAllowed: true,
    },
  });

  return NextResponse.json({ course });
}
