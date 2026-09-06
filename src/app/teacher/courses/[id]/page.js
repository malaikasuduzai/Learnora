import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import CourseContentManager from "@/components/teacher/CourseContentManager";

export default async function TeacherCourseContentPage({ params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  // Confirm this course is actually assigned to the teacher before
  // rendering anything, same guard the API routes apply.
  const course = await prisma.course.findFirst({
    where: { id: params.id, teacherId: user.id },
    select: { id: true },
  });
  if (!course) notFound();

  return (
    <DashboardShell user={user}>
      <CourseContentManager courseId={params.id} />
    </DashboardShell>
  );
}
