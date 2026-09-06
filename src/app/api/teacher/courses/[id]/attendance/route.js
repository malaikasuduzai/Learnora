import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { markAttendanceSchema, flattenZodError } from "@/lib/validations";
import { todayDateString, isAttendanceRecordLocked } from "@/lib/attendanceDisplay";

async function loadOwnedCourse(courseId, teacherId) {
  return prisma.course.findFirst({
    where: { id: courseId, teacherId },
    select: {
      id: true,
      title: true,
      attendanceWindowStart: true,
      attendanceWindowEnd: true,
      lateAllowed: true,
    },
  });
}

// GET /api/teacher/courses/:id/attendance?date=YYYY-MM-DD — the enrolled
// roster for this course on one date, with whatever attendance row already
// exists for each student that day (PRD section 22: "Teachers should be
// able to view attendance for their assigned courses"). Defaults to today
// so opening the page with no query string shows the roster to take.
export async function GET(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadOwnedCourse(params.id, user.id);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim() || todayDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    orderBy: { student: { name: "asc" } },
    select: { student: { select: { id: true, name: true, email: true } } },
  });

  const records = await prisma.attendance.findMany({
    where: { courseId: course.id, date: new Date(date) },
    select: { studentId: true, status: true, markedBy: true, markedAt: true, adminUnlockedAt: true },
  });
  const byStudent = new Map(records.map((r) => [r.studentId, r]));

  const students = enrollments.map(({ student }) => {
    const raw = byStudent.get(student.id) ?? null;
    if (!raw) return { student, record: null, locked: false };
    const record = {
      studentId: raw.studentId,
      status: raw.status,
      markedBy: raw.markedBy,
      markedAt: raw.markedAt,
      adminUnlocked: Boolean(raw.adminUnlockedAt),
    };
    return { student, record, locked: isAttendanceRecordLocked(record) };
  });

  return NextResponse.json({ course, date, students });
}

// POST /api/teacher/courses/:id/attendance — take/update attendance for a
// set of students on one date (PRD section 22/27: "Monitor Attendance").
// This is also the only way an ABSENT or LATE row gets written, since a
// student can only ever self-mark PRESENT within the window.
export async function POST(request, { params }) {
  const { user, error } = await requireRole(["TEACHER"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const course = await loadOwnedCourse(params.id, user.id);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = markAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flattenZodError(parsed.error) },
      { status: 422 }
    );
  }
  const data = parsed.data;

  if (data.date > todayDateString()) {
    return NextResponse.json(
      { error: "Attendance can't be taken for a future date." },
      { status: 422 }
    );
  }

  // Late is always available to teachers for marking attendance — it's no
  // longer gated behind a per-course Admin toggle.


  const studentIds = data.records.map((r) => r.studentId);
  const enrolledCount = await prisma.enrollment.count({
    where: { courseId: course.id, studentId: { in: studentIds } },
  });
  if (enrolledCount !== new Set(studentIds).size) {
    return NextResponse.json(
      { error: "Every student must be enrolled in this course." },
      { status: 422 }
    );
  }

  const date = new Date(data.date);

  // Records saved more than ATTENDANCE_EDIT_WINDOW_DAYS ago are closed —
  // like a real gradebook, a teacher can't quietly rewrite old history.
  // Anything in the payload that's locked (and hasn't been granted a
  // one-time Admin unlock) is silently skipped rather than failing the
  // whole batch, so correcting today's roster never gets blocked by one
  // stale row.
  const existing = await prisma.attendance.findMany({
    where: { courseId: course.id, date, studentId: { in: studentIds } },
    select: { studentId: true, markedAt: true, adminUnlockedAt: true },
  });
  const existingByStudent = new Map(existing.map((r) => [r.studentId, r]));

  const editable = [];
  const lockedStudentIds = [];
  const unlockedStudentIds = [];
  for (const record of data.records) {
    const current = existingByStudent.get(record.studentId);
    const locked = isAttendanceRecordLocked(
      current ? { markedAt: current.markedAt, adminUnlocked: Boolean(current.adminUnlockedAt) } : null
    );
    if (locked) {
      lockedStudentIds.push(record.studentId);
      continue;
    }
    if (current?.adminUnlockedAt) unlockedStudentIds.push(record.studentId);
    editable.push(record);
  }

  if (editable.length > 0) {
    await prisma.$transaction(
      editable.map((record) =>
        prisma.attendance.upsert({
          where: {
            courseId_studentId_date: { courseId: course.id, studentId: record.studentId, date },
          },
          // Saving consumes any Admin unlock grant — the next out-of-window
          // edit needs a fresh one.
          update: { status: record.status, markedBy: "TEACHER", adminUnlockedAt: null },
          create: {
            courseId: course.id,
            studentId: record.studentId,
            date,
            status: record.status,
            markedBy: "TEACHER",
          },
        })
      )
    );
  }

  const records = await prisma.attendance.findMany({
    where: { courseId: course.id, date },
    select: { studentId: true, status: true, markedBy: true, markedAt: true, adminUnlockedAt: true },
  });

  return NextResponse.json({
    date: data.date,
    records: records.map((r) => ({
      studentId: r.studentId,
      status: r.status,
      markedBy: r.markedBy,
      markedAt: r.markedAt,
      adminUnlocked: Boolean(r.adminUnlockedAt),
    })),
    lockedStudentIds,
  });
}
