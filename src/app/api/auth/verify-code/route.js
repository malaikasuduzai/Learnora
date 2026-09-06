import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCodeSchema, flattenZodError } from "@/lib/validations";
import { verifyCode } from "@/lib/passwordReset";
import { signPasswordResetToken } from "@/lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = verifyCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { email, code } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const invalidCode = () =>
    NextResponse.json({ error: "That code is incorrect or has expired." }, { status: 400 });

  if (!user || !user.isActive) return invalidCode();

  const isValid = await verifyCode(user.id, code);
  if (!isValid) return invalidCode();

  const resetToken = await signPasswordResetToken(user.id);
  return NextResponse.json({ resetToken });
}
