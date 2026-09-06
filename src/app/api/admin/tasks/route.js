import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const CAN_VIEW_TASKS = ["SUPER_ADMIN", "ADMIN"];

// GET /api/admin/tasks — platform-wide, read-only oversight of every task
// across every course (Day 5/6's Task & Assignment / Evaluation system).
// An Admin never creates, edits or grades a task themselves — that stays a
// Teacher's job — this is purely visibility: which tasks exist, how many
// students were assigned, how many have submitted, and how grading is
// going, so an Admin can spot a course that's stalled without opening each
// teacher's own "Tasks & submissions" screen individually.
export async function GET() {
  const { error } = await requireRole(CAN_VIEW_TASKS);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const [tasks, completedStats] = await Promise.all([
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { id: true, title: true, teacher: { select: { id: true, name: true } } },
        },
        _count: { select: { assignments: true, submissions: true } },
      },
    }),
    // Marks are normalized to a 0-100 scale per task (maxMarks varies task
    // to task), so the average below is computed in JS rather than a plain
    // SQL avg() over raw marks.
    prisma.taskSubmission.findMany({
      where: { status: "COMPLETED" },
      select: { taskId: true, marks: true },
    }),
  ]);

  const completedByTask = new Map();
  for (const row of completedStats) {
    if (!completedByTask.has(row.taskId)) completedByTask.set(row.taskId, []);
    completedByTask.get(row.taskId).push(row);
  }

  const result = tasks.map((task) => {
    const graded = completedByTask.get(task.id) ?? [];
    const scored = graded.filter((g) => g.marks != null);
    const averageMarks = scored.length
      ? Math.round(scored.reduce((sum, g) => sum + g.marks, 0) / scored.length)
      : null;

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      deadline: task.deadline,
      maxMarks: task.maxMarks,
      createdAt: task.createdAt,
      course: task.course,
      assignedCount: task._count.assignments,
      submittedCount: task._count.submissions,
      gradedCount: graded.length,
      averageMarks,
    };
  });

  return NextResponse.json({ tasks: result });
}
