import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { GraduationCapIcon } from "@/components/icons";
import TeachersManager from "@/components/admin/TeachersManager";

export default async function AdminTeachersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="admin"
          icon={GraduationCapIcon}
          title="Teachers"
          description="Manage teacher accounts."
        />
        <TeachersManager />
      </div>
    </DashboardShell>
  );
}
