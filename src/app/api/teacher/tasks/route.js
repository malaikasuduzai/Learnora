import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { taskSchema, flattenZodError } from "@/lib/validations";
import { notifyUsers } from "@/lib/notify";

// GET /api/teacher/tasks — every task the teacher has created, across all
// of their assigned courses, for the "Tasks & submissions" screen (PRD
// section 27: "Create Tasks, Set Deadlines, Review Submissions").
export async function GET() {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const tasks = await prisma.task.findMany({
    where: { course: { teacherId: user.id } },
    orderBy: { deadline: "asc" },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { assignments: true, submissions: true } },
    },
  });

  return NextResponse.json({ tasks });
}

// POST /api/teacher/tasks — "Teachers should be able to create tasks for
// students" (PRD section 14). The course must belong to this teacher, and
// every assigned student must actually be enrolled in it.
export async function POST(request) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const course = await prisma.course.findFirst({
    where: { id: data.courseId, teacherId: user.id },
    select: { id: true, title: true },
  });
  if (!course) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { courseId: "Choose one of your assigned courses" } },
      { status: 422 }
    );
  }

  const enrolledCount = await prisma.enrollment.count({
    where: { courseId: course.id, studentId: { in: data.assignedStudentIds } },
  });
  if (enrolledCount !== data.assignedStudentIds.length) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: { assignedStudentIds: "Every assigned student must be enrolled in this course" },
      },
      { status: 422 }
    );
  }

  const task = await prisma.task.create({
    data: {
      courseId: course.id,
      title: data.title,
      description: data.description,
      instructions: data.instructions || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: new Date(data.deadline),
      maxMarks: data.maxMarks,
      attachmentUrl: data.attachmentUrl || null,
      status: data.status,
      assignments: {
        create: data.assignedStudentIds.map((studentId) => ({ studentId })),
      },
    },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { assignments: true, submissions: true } },
    },
  });

  if (data.status === "PUBLISHED") {
    await notifyUsers(data.assignedStudentIds, {
      type: "TASK_ASSIGNED",
      title: `New task: ${task.title}`,
      body: `Course: ${course.title}`,
      link: `/student/tasks/${task.id}`,
    });
  }

  return NextResponse.json({ task }, { status: 201 });
}
