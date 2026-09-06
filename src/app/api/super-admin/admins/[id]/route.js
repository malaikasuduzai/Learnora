import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { updateAdminSchema, flattenZodError } from "@/lib/validations";

const CAN_MANAGE_ADMINS = ["SUPER_ADMIN"];

const ADMIN_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  isActive: true,
  createdAt: true,
};

// GET /api/super-admin/admins/:id — "View" an Admin account's details.
export async function GET(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_ADMINS);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const admin = await prisma.user.findFirst({
    where: { id: params.id, role: "ADMIN" },
    select: ADMIN_SELECT,
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({ admin });
}

// PATCH /api/super-admin/admins/:id — "Edit Admin" and
// "Activate/Deactivate Admin" share one endpoint since both are just a
// partial update of the same record.
export async function PATCH(request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_ADMINS);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const currentUser = await getCurrentUser();
  if (currentUser?.id === params.id) {
    return NextResponse.json(
      { error: "You can't change your own admin account from here." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const existing = await prisma.user.findFirst({ where: { id: params.id, role: "ADMIN" } });
  if (!existing) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const { name, phone, bio, isActive } = parsed.data;

  const admin = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: ADMIN_SELECT,
  });

  return NextResponse.json({ admin });
}
