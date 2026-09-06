import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import CourseLearn from "@/components/student/CourseLearn";

export default async function StudentCourseLearnPage({ params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId: params.id } },
  });
  if (!enrollment) notFound();

  return (
    <DashboardShell user={user}>
      <CourseLearn courseId={params.id} />
    </DashboardShell>
  );
}
