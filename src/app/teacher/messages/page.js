import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import TeacherMessages from "@/components/teacher/TeacherMessages";

export default async function TeacherMessagesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  return (
    <DashboardShell user={user}>
      <TeacherMessages />
    </DashboardShell>
  );
}
