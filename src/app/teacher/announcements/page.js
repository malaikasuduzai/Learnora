import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import AnnouncementsManager from "@/components/teacher/AnnouncementsManager";

export default async function TeacherAnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  return (
    <DashboardShell user={user}>
      <AnnouncementsManager />
    </DashboardShell>
  );
}
