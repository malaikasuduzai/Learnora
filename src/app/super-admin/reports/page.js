import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { BarChartIcon } from "@/components/icons";
import ReportsOverview from "@/components/super-admin/ReportsOverview";

export default async function SuperAdminReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="superadmin"
          icon={BarChartIcon}
          title="Reports"
          description="Platform-wide performance, rolled up by course."
        />
        <ReportsOverview />
      </div>
    </DashboardShell>
  );
}
