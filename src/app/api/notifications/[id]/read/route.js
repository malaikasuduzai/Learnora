import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/notifications/:id/read — marks one of the current user's own
// notifications as read. Idempotent: re-marking an already-read
// notification just keeps its original readAt.
export async function PATCH(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const notification = await prisma.notification.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { readAt: notification.readAt ?? new Date() },
  });

  return NextResponse.json({ notification: updated });
}
