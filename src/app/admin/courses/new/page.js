import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import CourseForm from "@/components/admin/CourseForm";

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [categories, teachers] = await Promise.all([
    prisma.courseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <DashboardShell user={user}>
      <CourseForm course={null} categories={categories} teachers={teachers} />
    </DashboardShell>
  );
}
