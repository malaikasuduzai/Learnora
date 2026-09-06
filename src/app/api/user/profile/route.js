import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateProfileSchema, flattenZodError } from "@/lib/validations";

export async function PATCH(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { name, phone, bio } = parsed.data;

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name,
      phone: phone || null,
      bio: bio || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
