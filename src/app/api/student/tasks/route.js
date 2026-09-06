import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { computeStudentTaskStatus } from "@/lib/taskDisplay";

// GET /api/student/tasks — "Student Task Dashboard" (PRD section 15):
// every task assigned to this student, with a computed status (Pending /
// Submitted / Under Review / Completed / Rejected / Overdue). Draft tasks
// never reach a student, even if they were already assigned before the
// teacher published it.
export async function GET() {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const assignments = await prisma.taskAssignment.findMany({
    where: { studentId: user.id, task: { status: "PUBLISHED" } },
    orderBy: { task: { deadline: "asc" } },
    include: {
      task: {
        include: {
          course: { select: { id: true, title: true } },
          submissions: { where: { studentId: user.id } },
        },
      },
    },
  });

  const tasks = assignments.map(({ task }) => {
    const submission = task.submissions[0] ?? null;
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      maxMarks: task.maxMarks,
      course: task.course,
      submission,
      status: computeStudentTaskStatus(task, submission),
    };
  });

  return NextResponse.json({ tasks });
}
