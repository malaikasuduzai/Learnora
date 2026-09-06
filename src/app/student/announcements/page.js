import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import StudentAnnouncements from "@/components/student/StudentAnnouncements";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import { BellIcon } from "@/components/icons";

export default async function StudentAnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <StudentPageHeader
          icon={BellIcon}
          title="Announcements"
          description="Updates from the teachers of your enrolled courses."
        />
        <StudentAnnouncements />
      </div>
    </DashboardShell>
  );
}
