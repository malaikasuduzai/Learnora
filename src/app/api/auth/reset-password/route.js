import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema, flattenZodError } from "@/lib/validations";
import { hashPassword, verifyPasswordResetToken } from "@/lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { resetToken, password } = parsed.data;
  const payload = await verifyPasswordResetToken(resetToken);

  if (!payload) {
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new code." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const hashedPassword = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "Password updated. You can now log in." });
}
