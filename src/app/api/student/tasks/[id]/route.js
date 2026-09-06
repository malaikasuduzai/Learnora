import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { computeStudentTaskStatus } from "@/lib/taskDisplay";

// GET /api/student/tasks/:id — full task detail (description, instructions,
// attachment, deadline, max marks) plus this student's own submission if
// they've made one (PRD section 13/16). Only visible to a student the task
// was actually assigned to.
export async function GET(_request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_studentId: { taskId: params.id, studentId: user.id } },
    include: {
      task: {
        include: {
          course: { select: { id: true, title: true } },
          submissions: { where: { studentId: user.id } },
        },
      },
    },
  });

  if (!assignment || assignment.task.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { task } = assignment;
  const submission = task.submissions[0] ?? null;

  return NextResponse.json({
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      startDate: task.startDate,
      deadline: task.deadline,
      maxMarks: task.maxMarks,
      attachmentUrl: task.attachmentUrl,
      course: task.course,
    },
    submission,
    status: computeStudentTaskStatus(task, submission),
  });
}
