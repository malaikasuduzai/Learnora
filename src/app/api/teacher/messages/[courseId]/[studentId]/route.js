import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { messageSchema, flattenZodError } from "@/lib/validations";
import { notifyUser } from "@/lib/notify";

// Both the course and the student must be genuinely connected to this
// teacher — a course they're assigned to, and a student actually enrolled
// in it — the same ownership check pattern used everywhere else in this
// build (attendance, tasks, evaluation).
async function loadConversation(courseId, studentId, teacherId) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId },
    select: { id: true, title: true },
  });
  if (!course) return null;

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId, studentId },
    select: { student: { select: { id: true, name: true } } },
  });
  if (!enrollment) return null;

  return { course, student: enrollment.student };
}

// GET /api/teacher/messages/:courseId/:studentId — the full thread with
// one student on one course, oldest first, and marks the student's
// messages as read the moment the teacher opens it.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const conversation = await loadConversation(params.courseId, params.studentId, user.id);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: {
      courseId: conversation.course.id,
      OR: [
        { senderId: user.id, receiverId: conversation.student.id },
        { senderId: conversation.student.id, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: {
      courseId: conversation.course.id,
      senderId: conversation.student.id,
      receiverId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    course: conversation.course,
    student: conversation.student,
    you: user.id,
    messages,
  });
}

// POST /api/teacher/messages/:courseId/:studentId — "Teacher -> Student:
// Provide Feedback, Send Instructions, Answer Questions" (PRD section 30).
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const conversation = await loadConversation(params.courseId, params.studentId, user.id);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

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
      courseId: conversation.course.id,
      senderId: user.id,
      receiverId: conversation.student.id,
      body: parsed.data.body,
    },
  });

  await notifyUser({
    userId: conversation.student.id,
    type: "MESSAGE",
    title: `New message from ${user.name}`,
    body: parsed.data.body.slice(0, 140),
    link: "/student/messages",
  });

  return NextResponse.json({ message }, { status: 201 });
}
