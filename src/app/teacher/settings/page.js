import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import { SettingsIcon } from "@/components/icons";

export default async function TeacherSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={SettingsIcon}
          title="Account settings"
          description="Update your profile information and password."
        />
        <SettingsPanel user={user} />
      </div>
    </DashboardShell>
  );
}
