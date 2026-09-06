import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import AttendanceManager from "@/components/teacher/AttendanceManager";

export default async function TeacherAttendancePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  return (
    <DashboardShell user={user}>
      <AttendanceManager />
    </DashboardShell>
  );
}
