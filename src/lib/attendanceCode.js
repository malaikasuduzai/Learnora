// Day 9 anti-spoofing fix — see the AttendanceSession model comment in
// schema.prisma for the full rationale. Kept framework-agnostic like
// attendanceDisplay.js so both API routes and client components can use it.

// 15 minutes covers a typical roll-call at the start of class without
// forcing the teacher to babysit the code for the whole session — long
// enough for latecomers within a reasonable grace period, short enough
// that a code posted in a group chat after class is useless well before
// the next session.
export const ATTENDANCE_CODE_TTL_MINUTES = 15;

// Excludes visually-confusable characters (0/O, 1/I/L) since this is
// meant to be read off a screen or announced out loud, not copy-pasted.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateAttendanceCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function codeExpiresAt(reference = new Date()) {
  return new Date(reference.getTime() + ATTENDANCE_CODE_TTL_MINUTES * 60 * 1000);
}

export function isCodeExpired(session, reference = new Date()) {
  if (!session) return true;
  return new Date(session.expiresAt).getTime() <= reference.getTime();
}

// Loose match: trims whitespace and ignores case, since students are
// typing a code off a projector/announcement, not pasting it.
export function codesMatch(a, b) {
  return typeof a === "string" && typeof b === "string" && a.trim().toUpperCase() === b.trim().toUpperCase();
}

export function secondsRemaining(session, reference = new Date()) {
  if (!session) return 0;
  const ms = new Date(session.expiresAt).getTime() - reference.getTime();
  return Math.max(0, Math.round(ms / 1000));
}
