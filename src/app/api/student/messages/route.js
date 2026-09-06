import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/student/messages — one row per enrolled course that has a
// teacher assigned (a student can only message the teacher of a course
// they're taking), each with its last message (if any) and how many of
// the teacher's messages are still unread.
export async function GET() {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    select: {
      course: {
        select: { id: true, title: true, teacher: { select: { id: true, name: true } } },
      },
    },
  });
  const withTeacher = enrollments.filter((e) => e.course.teacher).map((e) => e.course);
  const courseIds = withTeacher.map((c) => c.id);

  const messages = courseIds.length
    ? await prisma.message.findMany({
        where: { courseId: { in: courseIds }, OR: [{ senderId: user.id }, { receiverId: user.id }] },
        orderBy: { createdAt: "desc" },
        select: { courseId: true, senderId: true, receiverId: true, body: true, createdAt: true, readAt: true },
      })
    : [];

  const conversations = withTeacher.map((course) => {
    const thread = messages.filter((m) => m.courseId === course.id);
    return {
      courseId: course.id,
      course: { id: course.id, title: course.title },
      teacher: course.teacher,
      lastMessage: thread[0] ?? null,
      unreadCount: thread.filter((m) => m.receiverId === user.id && !m.readAt).length,
    };
  });

  conversations.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bt - at;
  });

  return NextResponse.json({ conversations });
}
