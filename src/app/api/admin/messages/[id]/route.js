import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const CAN_MANAGE_MESSAGES = ["SUPER_ADMIN", "ADMIN"];

const MESSAGE_SELECT = {
  id: true,
  name: true,
  email: true,
  subject: true,
  body: true,
  readAt: true,
  createdAt: true,
};

// PATCH /api/admin/messages/:id — "Mark as read/unread". Body is
// { read: true | false }; readAt is stamped or cleared accordingly, the
// same readAt-as-timestamp pattern Notification and Message already use.
export async function PATCH(request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_MESSAGES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.read !== "boolean") {
    return NextResponse.json({ error: "'read' must be true or false" }, { status: 422 });
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const message = await prisma.contactMessage.update({
    where: { id: params.id },
    data: { readAt: body.read ? new Date() : null },
    select: MESSAGE_SELECT,
  });

  return NextResponse.json({ message });
}

// DELETE /api/admin/messages/:id — "Delete messages". Hard delete: unlike
// Message (student <-> teacher chat), there's no thread to leave a gap in.
export async function DELETE(_request, { params }) {
  const { error } = await requireRole(CAN_MANAGE_MESSAGES);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const existing = await prisma.contactMessage.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  await prisma.contactMessage.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
