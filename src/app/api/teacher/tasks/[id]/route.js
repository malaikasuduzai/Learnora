import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { taskSchema, flattenZodError } from "@/lib/validations";
import { notifyUsers } from "@/lib/notify";

async function loadOwnedTask(taskId, teacherId) {
  return prisma.task.findFirst({ where: { id: taskId, course: { teacherId } } });
}

// GET /api/teacher/tasks/:id — full detail plus every assigned student's
// submission (if any), so the teacher can see who has submitted, who
// hasn't, and read what was submitted. Read-only here: marking, feedback
// and approve/reject are Day 6 — Evaluation System.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const task = await prisma.task.findFirst({
    where: { id: params.id, course: { teacherId: user.id } },
    include: {
      course: { select: { id: true, title: true } },
      assignments: {
        orderBy: { student: { name: "asc" } },
        include: { student: { select: { id: true, name: true, email: true } } },
      },
      submissions: true,
    },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const submissionByStudent = new Map(task.submissions.map((s) => [s.studentId, s]));
  const students = task.assignments.map((a) => ({
    student: a.student,
    submission: submissionByStudent.get(a.studentId) ?? null,
  }));

  return NextResponse.json({ task: { ...task, students } });
}

// PATCH /api/teacher/tasks/:id — edit task fields and reconcile the
// assigned-students list. A student dropped from the list has their
// TaskAssignment (and any submission they'd already made) removed; a newly
// added student gets a fresh TaskAssignment. Existing submissions for
// students who stay assigned are left untouched.
export async function PATCH(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const task = await loadOwnedTask(params.id, user.id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // A task's course can't be changed after creation — only fields and the
  // assigned-student list. Pin courseId to the existing value so the
  // shared taskSchema can still validate everything else.
  const parsed = taskSchema.safeParse({ ...body, courseId: task.courseId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const enrolledCount = await prisma.enrollment.count({
    where: { courseId: task.courseId, studentId: { in: data.assignedStudentIds } },
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

  const existing = await prisma.taskAssignment.findMany({
    where: { taskId: task.id },
    select: { studentId: true },
  });
  const existingIds = new Set(existing.map((a) => a.studentId));
  const nextIds = new Set(data.assignedStudentIds);
  const toAdd = [...nextIds].filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

  await prisma.$transaction([
    prisma.task.update({
      where: { id: task.id },
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        deadline: new Date(data.deadline),
        maxMarks: data.maxMarks,
        attachmentUrl: data.attachmentUrl || null,
        status: data.status,
      },
    }),
    ...(toRemove.length
      ? [
          prisma.taskAssignment.deleteMany({ where: { taskId: task.id, studentId: { in: toRemove } } }),
          prisma.taskSubmission.deleteMany({ where: { taskId: task.id, studentId: { in: toRemove } } }),
        ]
      : []),
    ...(toAdd.length
      ? [
          prisma.taskAssignment.createMany({
            data: toAdd.map((studentId) => ({ taskId: task.id, studentId })),
          }),
        ]
      : []),
  ]);

  const updated = await prisma.task.findUnique({
    where: { id: task.id },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { assignments: true, submissions: true } },
    },
  });

  // Notify anyone newly assigned, and — if this edit is what publishes a
  // task that was previously a Draft — everyone still on it, since a
  // Draft never triggered a notification when it was first created.
  if (updated.status === "PUBLISHED") {
    const toNotify = task.status === "DRAFT" ? data.assignedStudentIds : toAdd;
    if (toNotify.length) {
      await notifyUsers(toNotify, {
        type: "TASK_ASSIGNED",
        title: `New task: ${updated.title}`,
        body: `Course: ${updated.course.title}`,
        link: `/student/tasks/${updated.id}`,
      });
    }
  }

  return NextResponse.json({ task: updated });
}

// DELETE /api/teacher/tasks/:id — removes the task along with its
// assignments and submissions (cascades in the schema).
export async function DELETE(_request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const task = await loadOwnedTask(params.id, user.id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: task.id } });
  return NextResponse.json({ ok: true });
}
