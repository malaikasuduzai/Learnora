import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "lms_session";

const ROLE_PREFIX = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

const PROTECTED_PREFIXES = Object.values(ROLE_PREFIX);
const GUEST_ONLY_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-code",
  "/reset-password",
];

function getSecretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function getSessionPayload(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = await getSessionPayload(request);

  const matchedProtectedPrefix = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (matchedProtectedPrefix) {
    // Not logged in at all -> send to login, remembering where they wanted to go.
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in, but this section belongs to a different role -> bounce them
    // to their own dashboard instead of letting them view it.
    const ownPrefix = ROLE_PREFIX[session.role];
    if (ownPrefix !== matchedProtectedPrefix) {
      return NextResponse.redirect(new URL(ownPrefix ?? "/login", request.url));
    }
  }

  // Already logged in and trying to view the login/register pages -> send
  // them straight to their dashboard instead.
  if (session && GUEST_ONLY_PAGES.includes(pathname)) {
    const ownPrefix = ROLE_PREFIX[session.role] ?? "/login";
    return NextResponse.redirect(new URL(ownPrefix, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/verify-code",
    "/reset-password",
  ],
};
