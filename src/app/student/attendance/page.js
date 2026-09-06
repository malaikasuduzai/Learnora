import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import StudentAttendance from "@/components/student/StudentAttendance";

export default async function StudentAttendancePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  return (
    <DashboardShell user={user}>
      <StudentAttendance />
    </DashboardShell>
  );
}
