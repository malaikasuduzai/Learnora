import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { messageSchema, flattenZodError } from "@/lib/validations";

async function loadOwnMessage(courseId, messageId, teacherId) {
  const course = await prisma.course.findFirst({ where: { id: courseId, teacherId }, select: { id: true } });
  if (!course) return null;
  return prisma.message.findFirst({ where: { id: messageId, courseId, senderId: teacherId } });
}

// PATCH /api/teacher/messages/:courseId/:studentId/:messageId — edit a
// message the teacher sent themselves (PRD section 30). :studentId isn't
// used for the lookup (the message id + ownership already pin it down)
// but is kept in the path to match the thread route it lives under.
export async function PATCH(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
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

// DELETE /api/teacher/messages/:courseId/:studentId/:messageId —
// soft-delete a message the teacher sent themselves.
export async function DELETE(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
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
