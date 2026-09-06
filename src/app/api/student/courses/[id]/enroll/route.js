import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

// POST /api/student/courses/:id/enroll — self-service enrollment (PRD
// section 10: "Browse Course -> View Course Details -> Enroll ->
// Enrollment Confirmation -> Course Appears in My Courses"). This is the
// student-initiated counterpart to an Admin manually enrolling someone
// (POST /api/admin/courses/:id/enrollments) — same Enrollment row, same
// unique (studentId, courseId) constraint, just a different actor.
export async function POST(_request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "This course isn't open for enrollment right now." },
      { status: 422 }
    );
  }

  const alreadyEnrolled = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId: course.id } },
  });
  if (alreadyEnrolled) {
    return NextResponse.json({ error: "You're already enrolled in this course." }, { status: 409 });
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId: user.id, courseId: course.id },
    select: { id: true, status: true, enrolledAt: true },
  });

  if (course.teacherId) {
    await notifyUser({
      userId: course.teacherId,
      type: "ENROLLMENT",
      title: `${user.name} enrolled in ${course.title}`,
      body: "They now appear on your course roster.",
      link: `/teacher/courses/${course.id}`,
    });
  }

  return NextResponse.json({ enrollment }, { status: 201 });
}
