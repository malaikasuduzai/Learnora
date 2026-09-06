import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures, computeLectureStatuses } from "@/lib/courseContent";

// POST /api/student/lectures/:id/complete — "Students should be able to
// mark lectures as completed" (PRD section 25). Only the student's current
// unlocked lecture can be marked — this keeps the sequential unlock model
// (section 25's "Locked" example) honest instead of letting a student mark
// lecture 10 complete before ever opening lectures 1-9.
export async function POST(_request, { params }) {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const lecture = await prisma.lecture.findUnique({
    where: { id: params.id },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  const courseId = lecture.module.courseId;
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: user.id, courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "You are not enrolled in this course." }, { status: 403 });
  }

  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: { id: true, order: true, lectures: { orderBy: { order: "asc" }, select: { id: true } } },
  });
  const flat = flattenLectures(modules);

  const completedRows = await prisma.lectureProgress.findMany({
    where: { studentId: user.id, lectureId: { in: flat.map((l) => l.id) } },
    select: { lectureId: true },
  });
  const completedIds = new Set(completedRows.map((r) => r.lectureId));
  const statuses = computeLectureStatuses(flat, completedIds);
  const status = statuses.get(lecture.id);

  if (status === "locked") {
    return NextResponse.json(
      { error: "Complete the earlier lectures in this course first." },
      { status: 409 }
    );
  }

  await prisma.lectureProgress.upsert({
    where: { studentId_lectureId: { studentId: user.id, lectureId: lecture.id } },
    update: {},
    create: { studentId: user.id, lectureId: lecture.id },
  });

  return NextResponse.json({ success: true });
}
