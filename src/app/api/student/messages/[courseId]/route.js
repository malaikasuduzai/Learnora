import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { messageSchema, flattenZodError } from "@/lib/validations";
import { notifyUser } from "@/lib/notify";

async function loadConversation(courseId, studentId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId, studentId },
    select: {
      course: { select: { id: true, title: true, teacher: { select: { id: true, name: true } } } },
    },
  });
  if (!enrollment || !enrollment.course.teacher) return null;
  return enrollment.course;
}

// GET /api/student/messages/:courseId — the full thread with this course's
// teacher, oldest first, and marks the teacher's messages as read.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadConversation(params.courseId, user.id);
  if (!course) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: {
      courseId: course.id,
      OR: [
        { senderId: user.id, receiverId: course.teacher.id },
        { senderId: course.teacher.id, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { courseId: course.id, senderId: course.teacher.id, receiverId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    course: { id: course.id, title: course.title },
    teacher: course.teacher,
    you: user.id,
    messages,
  });
}

// POST /api/student/messages/:courseId — "Student -> Teacher: Ask
// Questions, Discuss Tasks, Request Guidance" (PRD section 30).
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadConversation(params.courseId, user.id);
  if (!course) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

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

  const message = await prisma.message.create({
    data: {
      courseId: course.id,
      senderId: user.id,
      receiverId: course.teacher.id,
      body: parsed.data.body,
    },
  });

  await notifyUser({
    userId: course.teacher.id,
    type: "MESSAGE",
    title: `New message from ${user.name}`,
    body: parsed.data.body.slice(0, 140),
    link: "/teacher/messages",
  });

  return NextResponse.json({ message }, { status: 201 });
}
