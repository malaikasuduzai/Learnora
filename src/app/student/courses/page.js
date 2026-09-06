import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import StudentCourses from "@/components/student/StudentCourses";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import { BookOpenIcon } from "@/components/icons";

export default async function StudentCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <StudentPageHeader
          icon={BookOpenIcon}
          title="My courses"
          description="Your enrolled courses and their progress."
          action={
            <Link href="/student/courses/browse" className="btn-brass w-auto shrink-0">
              Browse courses
            </Link>
          }
        />
        <StudentCourses />
      </div>
    </DashboardShell>
  );
}
