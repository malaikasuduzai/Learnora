import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import TasksManager from "@/components/teacher/TasksManager";

export default async function TeacherTasksPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  return (
    <DashboardShell user={user}>
      <TasksManager />
    </DashboardShell>
  );
}
