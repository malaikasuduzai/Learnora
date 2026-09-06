import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { messageSchema, flattenZodError } from "@/lib/validations";

async function loadOwnMessage(courseId, messageId, userId) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, courseId, senderId: userId },
  });
  return message;
}

// PATCH /api/student/messages/:courseId/:messageId — edit a message the
// student sent themselves (PRD section 30). Only the sender can edit their
// own message, and a deleted message can't be un-deleted this way.
export async function PATCH(request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const message = await loadOwnMessage(params.courseId, params.messageId, user.id);
  if (!message || message.deletedAt) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { body: parsed.data.body, editedAt: new Date() },
  });

  return NextResponse.json({ message: updated });
}

// DELETE /api/student/messages/:courseId/:messageId — soft-delete a
// message the student sent themselves. The row stays (so the other
// person's side of the conversation doesn't jump around) but the body is
// cleared and the UI shows a "message deleted" placeholder.
export async function DELETE(_request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const message = await loadOwnMessage(params.courseId, params.messageId, user.id);
  if (!message || message.deletedAt) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { body: "", deletedAt: new Date() },
  });

  return NextResponse.json({ message: updated });
}
