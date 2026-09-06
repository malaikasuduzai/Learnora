import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "lms_session";
const JWT_ALG = "HS256";
const SESSION_DURATION = "7d";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to your .env file.");
  }
  return new TextEncoder().encode(secret);
}

// ---- Passwords -------------------------------------------------------

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ---- JWT ---------------------------------------------------------------

export async function signAuthToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifyAuthToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (err) {
    return null;
  }
}

// ---- Cookies (server actions / route handlers) --------------------------

export async function setAuthCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}

// ---- Password reset (short-lived, single-purpose token) -----------------
// Issued only after a user proves ownership of the account via the emailed
// link or the SMS code, and accepted only by /api/auth/reset-password.

const RESET_TOKEN_DURATION = "10m";

export async function signPasswordResetToken(userId) {
  return new SignJWT({ sub: userId, purpose: "password-reset" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(RESET_TOKEN_DURATION)
    .sign(getSecretKey());
}

export async function verifyPasswordResetToken(token) {
  const payload = await verifyAuthToken(token);
  if (!payload || payload.purpose !== "password-reset" || !payload.sub) return null;
  return payload;
}

// ---- Current user (server components / route handlers) ------------------

export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
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

  if (!user || !user.isActive) return null;
  return user;
}

// ---- Role -> default landing route --------------------------------------

export const ROLE_HOME_ROUTE = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export function homeRouteForRole(role) {
  return ROLE_HOME_ROUTE[role] ?? "/login";
}

// ---- Role guard for API routes ------------------------------------------
// Fetches the current user and checks their role is in `allowedRoles`.
// Returns { user } on success, or { error: NextResponse } to return as-is.

export async function requireRole(allowedRoles) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: { status: 401, message: "You must be logged in." } };
  }
  if (!allowedRoles.includes(user.role)) {
    return { error: { status: 403, message: "You don't have permission to do that." } };
  }
  return { user };
}
