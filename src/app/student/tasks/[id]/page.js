import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import TaskSubmission from "@/components/student/TaskSubmission";

export default async function StudentTaskPage({ params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  // Confirm this task was actually assigned to the student before
  // rendering anything, same guard the API route applies.
  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_studentId: { taskId: params.id, studentId: user.id } },
    select: { task: { select: { status: true } } },
  });
  if (!assignment || assignment.task.status !== "PUBLISHED") notFound();

  return (
    <DashboardShell user={user}>
      <TaskSubmission taskId={params.id} />
    </DashboardShell>
  );
}
