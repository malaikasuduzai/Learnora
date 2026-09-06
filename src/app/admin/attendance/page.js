import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import RolePageHeader from "@/components/RolePageHeader";
import { CalendarCheckIcon, LockIcon } from "@/components/icons";
import AttendanceSettingsManager from "@/components/admin/AttendanceSettingsManager";
import AttendanceUnlockManager from "@/components/admin/AttendanceUnlockManager";

export default async function AdminAttendancePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      attendanceWindowStart: true,
      attendanceWindowEnd: true,
      lateAllowed: true,
      teacher: { select: { id: true, name: true } },
    },
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <RolePageHeader
          role="admin"
          icon={CalendarCheckIcon}
          title="Attendance settings"
          description="Daily attendance window per course."
        />
        <AttendanceSettingsManager initialCourses={courses} />

        <RolePageHeader
          role="admin"
          icon={LockIcon}
          title="Locked records"
          description="A teacher can correct attendance for up to 3 days after marking it. After that it locks and needs your unlock for one more correction."
        />
        <div className="card border-l-4 border-l-role-admin p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-l-role-admin hover:shadow-gold">
          <AttendanceUnlockManager courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
        </div>
      </div>
    </DashboardShell>
  );
}
