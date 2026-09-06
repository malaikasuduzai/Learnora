// Shared helper for writing Notification rows (Day 8, PRD section 28).
// Every other Day 8 flow — and a few earlier ones (enrollment, task
// assignment, evaluation, lecture uploads) — calls through here rather
// than writing to `prisma.notification` directly, so the set of possible
// notification shapes stays in one place. Kept framework-agnostic (no
// "use client") so both server components and API routes can import it.

import { prisma } from "./prisma";

// Notify a single user.
export async function notifyUser({ userId, type, title, body, link }) {
  if (!userId) return null;
  return prisma.notification.create({
    data: { userId, type, title, body: body || null, link: link || null },
  });
}

// Notify a batch of users with the same message (e.g. every student
// enrolled in a course). Duplicate ids are collapsed and empty/undefined
// ids are dropped so a bad caller can't crash the write.
export async function notifyUsers(userIds, { type, title, body, link }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: ids.map((userId) => ({ userId, type, title, body: body || null, link: link || null })),
  });
}


// Notify everyone with one or more platform roles. This is used for
// administrative events so Admin and Super Admin bells receive the same
// real-time-style updates as Teachers and Students.
export async function notifyRoles(roles, payload) {
  const uniqueRoles = [...new Set((roles || []).filter(Boolean))];
  if (uniqueRoles.length === 0) return { count: 0 };
  const users = await prisma.user.findMany({
    where: { role: { in: uniqueRoles }, isActive: true },
    select: { id: true },
  });
  return notifyUsers(users.map((user) => user.id), payload);
}
