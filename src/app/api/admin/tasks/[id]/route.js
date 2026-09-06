import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const CAN_VIEW_TASKS = ["SUPER_ADMIN", "ADMIN"];

// GET /api/admin/tasks/:id — full detail plus every assigned student's
// submission, mirroring GET /api/teacher/tasks/:id but without the
// teacher-ownership check (an Admin can look at any course) and strictly
// read-only — there's no PATCH/DELETE here, grading and editing stay on
// the Teacher's own "Tasks & submissions" screen.
export async function GET(_request, { params }) {
  const { error } = await requireRole(CAN_VIEW_TASKS);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      course: {
        select: { id: true, title: true, teacher: { select: { id: true, name: true } } },
      },
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
