import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import CourseDetails from "@/components/admin/CourseDetails";
import EnrollmentsPanel from "@/components/admin/EnrollmentsPanel";

export default async function CourseDetailsPage({ params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [course, enrollments] = await Promise.all([
    prisma.course.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { courseId: params.id },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        student: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  if (!course) notFound();

  return (
    <DashboardShell user={user}>
      <div className="space-y-5">
        <CourseDetails course={course} enrollmentCount={enrollments.length} />
        <div className="mx-auto max-w-3xl">
          <EnrollmentsPanel courseId={course.id} initialEnrollments={enrollments} />
        </div>
      </div>
    </DashboardShell>
  );
}
