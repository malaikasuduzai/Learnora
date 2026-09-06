import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { createAdminSchema, flattenZodError } from "@/lib/validations";
import { notifyUser, notifyRoles } from "@/lib/notify";

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

// GET /api/super-admin/admins?search= — powers the Admins management table.
// Only a Super Admin may see or manage other Admin accounts.
export async function GET(request) {
  const { user, error } = await requireRole(CAN_MANAGE_ADMINS);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      ...(search
        ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: ADMIN_SELECT,
  });

  return NextResponse.json({ admins });
}

// POST /api/super-admin/admins — Super Admin creates an Admin account
// ("Create Admin" from the PRD's Super Admin — Admin Management section).
export async function POST(request) {
  const { user, error } = await requireRole(CAN_MANAGE_ADMINS);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createAdminSchema.safeParse(body);
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

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "ADMIN",
    },
    select: ADMIN_SELECT,
  });

  await Promise.all([
    notifyUser({
      userId: admin.id,
      type: "ANNOUNCEMENT",
      title: "Your Learnora Admin account is ready",
      body: "You now have access to the Admin dashboard and platform tools.",
      link: "/admin",
    }),
    notifyRoles(["SUPER_ADMIN"], {
      type: "ANNOUNCEMENT",
      title: "New Admin account created",
      body: `${admin.name} was added by ${user.name}.`,
      link: "/super-admin/admins",
    }),
  ]);

  return NextResponse.json({ admin }, { status: 201 });
}
