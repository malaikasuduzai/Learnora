import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { BookOpenIcon } from "@/components/icons";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, levelLabel } from "@/lib/courseDisplay";

export default async function SuperAdminCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      level: true,
      status: true,
      duration: true,
      createdAt: true,
      category: { select: { name: true } },
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="superadmin"
          icon={BookOpenIcon}
          title="Courses"
          description="Platform-wide overview of every course."
        />

        <div className="card overflow-hidden">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <BookOpenIcon className="h-8 w-8 text-ink-300" />
              <p className="text-sm font-medium text-ink-600">No courses yet</p>
              <p className="max-w-xs text-xs text-ink-400">Courses will appear here once created.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Teacher</th>
                    <th className="px-5 py-3 font-medium">Level</th>
                    <th className="px-5 py-3 font-medium">Enrollments</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="transition-colors hover:bg-role-superadminSoft/50">
                      <td className="border-l-4 border-l-role-superadmin px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <BookOpenIcon className="h-4 w-4 shrink-0 text-role-superadmin" />
                          <div className="min-w-0">
                            <p className="max-w-xs truncate text-sm font-medium text-ink-900">{course.title}</p>
                            <p className="text-xs text-ink-400">{course.duration}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">{course.category?.name ?? "\u2014"}</td>
                      <td className="px-5 py-3.5 text-ink-600">{course.teacher?.name ?? "Unassigned"}</td>
                      <td className="px-5 py-3.5 text-ink-600">{levelLabel(course.level)}</td>
                      <td className="px-5 py-3.5 text-ink-600">{course._count?.enrollments ?? 0}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={course.status} />
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">{formatDate(course.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
