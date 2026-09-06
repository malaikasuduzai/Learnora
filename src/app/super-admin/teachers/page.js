import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { GraduationCapIcon } from "@/components/icons";
import TeachersManager from "@/components/admin/TeachersManager";

export default async function SuperAdminTeachersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="superadmin"
          icon={GraduationCapIcon}
          title="Teachers"
          description="Platform-wide view of every teacher account."
        />
        <TeachersManager />
      </div>
    </DashboardShell>
  );
}
