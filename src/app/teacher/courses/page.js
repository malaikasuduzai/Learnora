import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import TeacherCourses from "@/components/dashboard/TeacherCourses";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import { BookOpenIcon } from "@/components/icons";

export default async function TeacherCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={BookOpenIcon}
          title="My courses"
          description="Courses you're teaching this term."
        />
        <TeacherCourses />
      </div>
    </DashboardShell>
  );
}
