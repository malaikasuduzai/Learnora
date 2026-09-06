import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlusIcon } from "@/components/icons";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { BookOpenIcon } from "@/components/icons";
import CoursesTable from "@/components/admin/CoursesTable";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        duration: true,
        level: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    }),
    prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { courses: true } } },
    }),
  ]);

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="admin"
          icon={BookOpenIcon}
          title="Courses"
          description="Manage courses and categories."
          action={
            <Link href="/admin/courses/new" className="btn-brass w-auto px-4">
              <PlusIcon className="h-4 w-4" />
              New course
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CoursesTable initialCourses={courses} categories={categories} />
          </div>
          <div>
            <CategoryManager categories={categories} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
