import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import StudentProgress from "@/components/student/StudentProgress";

export default async function StudentProgressPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  return (
    <DashboardShell user={user}>
      <StudentProgress />
    </DashboardShell>
  );
}
