import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import TeacherOverview from "@/components/dashboard/TeacherOverview";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import { ROLE_META } from "@/lib/dashboardConfig";

export default async function TeacherPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const meta = ROLE_META.TEACHER;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={meta.icon}
          title={`Welcome back, ${user.name.split(" ")[0]}`}
          description={meta.description}
        />
        <TeacherOverview />
      </div>
    </DashboardShell>
  );
}
