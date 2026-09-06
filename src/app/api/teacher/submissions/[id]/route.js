import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { evaluateSubmissionSchema, flattenZodError } from "@/lib/validations";
import { notifyUser } from "@/lib/notify";

async function loadOwnedSubmission(submissionId, teacherId) {
  return prisma.taskSubmission.findFirst({
    where: { id: submissionId, task: { course: { teacherId } } },
    include: { task: { select: { id: true, title: true, maxMarks: true } } },
  });
}

// PATCH /api/teacher/submissions/:id — "Teacher Task Evaluation" (PRD
// section 17): open a submission, add feedback, assign marks, and change
// its status (Under Review / Completed / Rejected — i.e. Approve/Reject).
// Marks and feedback are stored directly on TaskSubmission (already added
// to the schema in the Day 5 slice), so this is a pure update — no
// migration needed. Re-evaluating an already-graded submission (to correct
// a mark, for instance) is allowed; there's no one-way lock the way
// lecture completion has one.
export async function PATCH(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const submission = await loadOwnedSubmission(params.id, user.id);
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = evaluateSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }
  const data = parsed.data;

  if (data.marks != null && data.marks > submission.task.maxMarks) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: { marks: `Marks can't exceed the maximum of ${submission.task.maxMarks}` },
      },
      { status: 422 }
    );
  }

  const updated = await prisma.taskSubmission.update({
    where: { id: submission.id },
    data: {
      status: data.status,
      marks: data.marks ?? null,
      feedback: data.feedback || null,
    },
  });

  if (data.status === "COMPLETED" || data.status === "REJECTED") {
    await notifyUser({
      userId: submission.studentId,
      type: "TASK_EVALUATED",
      title:
        data.status === "COMPLETED"
          ? `"${submission.task.title}" was graded`
          : `"${submission.task.title}" was rejected`,
      body:
        data.status === "COMPLETED" && data.marks != null
          ? `Marks: ${data.marks} / ${submission.task.maxMarks}`
          : data.feedback || undefined,
      link: `/student/tasks/${submission.task.id}`,
    });
  }

  return NextResponse.json({ submission: updated });
}
