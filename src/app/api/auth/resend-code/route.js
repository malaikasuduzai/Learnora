import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resendCodeSchema, flattenZodError } from "@/lib/validations";
import {
  issueResetCode,
  sendResetCodeByEmail,
  canResend,
  RESEND_COOLDOWN,
} from "@/lib/passwordReset";

const GENERIC_RESPONSE = { message: "A new code has been sent if the account exists." };

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = resendCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const allowed = await canResend(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: `Please wait a bit before requesting another code.`, cooldownSeconds: RESEND_COOLDOWN },
      { status: 429 }
    );
  }

  const code = await issueResetCode(user.id);
  await sendResetCodeByEmail(user.email, code);

  return NextResponse.json({
    ...GENERIC_RESPONSE,
    ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  });
}
