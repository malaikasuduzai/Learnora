import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import StudentsOverview from "@/components/teacher/StudentsOverview";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import { UsersIcon } from "@/components/icons";

export default async function TeacherStudentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={UsersIcon}
          title="Students"
          description="Progress and attendance across your courses."
        />
        <StudentsOverview />
      </div>
    </DashboardShell>
  );
}
