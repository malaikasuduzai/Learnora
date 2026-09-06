import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import CourseForm from "@/components/admin/CourseForm";

export default async function EditCoursePage({ params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [course, categories, teachers] = await Promise.all([
    prisma.course.findUnique({ where: { id: params.id } }),
    prisma.courseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!course) notFound();

  return (
    <DashboardShell user={user}>
      <CourseForm course={course} categories={categories} teachers={teachers} />
    </DashboardShell>
  );
}
