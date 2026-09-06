import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { UsersIcon } from "@/components/icons";
import StudentsManager from "@/components/admin/StudentsManager";

export default async function SuperAdminStudentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="superadmin"
          icon={UsersIcon}
          title="Students"
          description="Platform-wide view of every student account."
        />
        <StudentsManager />
      </div>
    </DashboardShell>
  );
}
