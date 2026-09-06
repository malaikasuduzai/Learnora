import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, flattenZodError } from "@/lib/validations";
import { issueResetCode, sendResetCodeByEmail } from "@/lib/passwordReset";

// Always responds with the same generic, successful shape whether or not
// the email is registered — this endpoint must never be usable to check
// which emails have accounts.
const GENERIC_RESPONSE = {
  message: "If an account exists for that email, a reset code has been sent.",
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
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

  const code = await issueResetCode(user.id);
  await sendResetCodeByEmail(user.email, code);

  return NextResponse.json({
    ...GENERIC_RESPONSE,
    // Dev convenience only: keep the code visible while testing locally.
    ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  });
}
