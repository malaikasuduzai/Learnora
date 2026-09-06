import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { ShieldIcon } from "@/components/icons";
import AdminsManager from "@/components/super-admin/AdminsManager";

export default async function SuperAdminAdminsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="superadmin"
          icon={ShieldIcon}
          title="Admins"
          description="Manage Admin accounts."
        />
        <AdminsManager currentUserId={user.id} />
      </div>
    </DashboardShell>
  );
}
