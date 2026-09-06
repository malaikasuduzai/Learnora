import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/teacher/messages — one row per (course, enrolled student) pair
// across every course this teacher owns, each with its last message (if
// any) and how many of the student's messages are still unread. A
// "conversation" isn't its own model — it's simply every Message that
// shares this (courseId, studentId, teacherId) triple, so this just reads
// Enrollment + Message and joins them in memory. Every enrolled student
// shows up here even before a first message is sent, so the teacher can
// start the conversation (PRD section 30: "Teacher -> Student").
export async function GET() {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    select: { id: true, title: true },
  });
  const courseIds = courses.map((c) => c.id);
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const enrollments = courseIds.length
    ? await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { student: { name: "asc" } },
        select: { courseId: true, student: { select: { id: true, name: true } } },
      })
    : [];

  const messages = courseIds.length
    ? await prisma.message.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { createdAt: "desc" },
        select: {
          courseId: true,
          senderId: true,
          receiverId: true,
          body: true,
          createdAt: true,
          readAt: true,
        },
      })
    : [];

  const conversations = enrollments.map(({ courseId, student }) => {
    const thread = messages.filter(
      (m) => m.courseId === courseId && (m.senderId === student.id || m.receiverId === student.id)
    );
    return {
      courseId,
      course: courseById.get(courseId),
      student,
      lastMessage: thread[0] ?? null,
      unreadCount: thread.filter((m) => m.senderId === student.id && !m.readAt).length,
    };
  });

  conversations.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bt - at;
  });

  return NextResponse.json({ conversations });
}
