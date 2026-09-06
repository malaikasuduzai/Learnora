import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { taskSubmissionSchema, flattenZodError } from "@/lib/validations";
import { notifyUser } from "@/lib/notify";

// POST /api/student/tasks/:id/submit — "Students should be able to submit
// their tasks directly through the platform" (PRD section 16). One
// submission row per (task, student): resubmitting before it's been
// reviewed overwrites the same row and refreshes submittedAt, rather than
// creating a new one. The PRD doesn't gate submission on the deadline the
// way attendance is gated on its window, so a late submission is still
// accepted — the "Overdue" badge the student saw beforehand simply
// disappears once they submit.
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_studentId: { taskId: params.id, studentId: user.id } },
    include: {
      task: {
        select: { status: true, title: true, course: { select: { teacherId: true } } },
      },
    },
  });
  if (!assignment || assignment.task.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // A submission already under review, evaluated, or rejected is locked —
  // the student can't quietly rewrite what the teacher is grading.
  const existing = await prisma.taskSubmission.findUnique({
    where: { taskId_studentId: { taskId: params.id, studentId: user.id } },
  });
  if (existing && existing.status !== "SUBMITTED") {
    return NextResponse.json(
      { error: "This submission is already being reviewed and can no longer be edited." },
      { status: 409 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = taskSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const submission = await prisma.taskSubmission.upsert({
    where: { taskId_studentId: { taskId: params.id, studentId: user.id } },
    create: {
      taskId: params.id,
      studentId: user.id,
      fileUrl: data.fileUrl || null,
      textAnswer: data.textAnswer || null,
      link: data.link || null,
      notes: data.notes || null,
    },
    update: {
      fileUrl: data.fileUrl || null,
      textAnswer: data.textAnswer || null,
      link: data.link || null,
      notes: data.notes || null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  if (assignment.task.course.teacherId) {
    await notifyUser({
      userId: assignment.task.course.teacherId,
      type: "TASK_SUBMITTED",
      title: `${user.name} submitted "${assignment.task.title}"`,
      link: "/teacher/tasks",
    });
  }

  return NextResponse.json({ submission }, { status: existing ? 200 : 201 });
}
