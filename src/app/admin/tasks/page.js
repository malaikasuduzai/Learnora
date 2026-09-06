import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { ClipboardListIcon } from "@/components/icons";
import TasksOverview from "@/components/admin/TasksOverview";

export default async function AdminTasksPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="admin"
          icon={ClipboardListIcon}
          title="Tasks"
          description="Every task, submission and grade across the platform."
        />
        <TasksOverview />
      </div>
    </DashboardShell>
  );
}
