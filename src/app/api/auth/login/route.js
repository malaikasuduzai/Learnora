import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAuthToken, setAuthCookie, homeRouteForRole } from "@/lib/auth";
import { loginSchema, flattenZodError } from "@/lib/validations";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Same generic message whether the email doesn't exist or the password is
  // wrong, so login can't be used to enumerate registered accounts.
  const invalidCredentials = () =>
    NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user) return invalidCredentials();

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) return invalidCredentials();

  if (!user.isActive) {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact your administrator." },
      { status: 403 }
    );
  }

  const token = await signAuthToken({ sub: user.id, role: user.role });
  await setAuthCookie(token);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    redirectTo: homeRouteForRole(user.role),
  });
}
