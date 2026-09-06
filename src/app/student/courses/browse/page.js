import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import StudentBrowseCourses from "@/components/student/StudentBrowseCourses";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import { SearchIcon } from "@/components/icons";

export default async function StudentBrowseCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <StudentPageHeader
          icon={SearchIcon}
          title="Browse courses"
          description="Find your next course and enroll in a click."
        />
        <StudentBrowseCourses />
      </div>
    </DashboardShell>
  );
}
