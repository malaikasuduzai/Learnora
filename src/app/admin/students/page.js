import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { UsersIcon } from "@/components/icons";
import StudentsManager from "@/components/admin/StudentsManager";

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="admin"
          icon={UsersIcon}
          title="Students"
          description="Manage student accounts."
        />
        <StudentsManager />
      </div>
    </DashboardShell>
  );
}
