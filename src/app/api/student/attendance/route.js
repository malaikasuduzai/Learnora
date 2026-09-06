import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { attendancePercent, isWithinAttendanceWindow, todayDateString } from "@/lib/attendanceDisplay";

// GET /api/student/attendance — "Today's Attendance", "Attendance
// Percentage" and the mark-attendance window for every enrolled course
// (PRD section 11: student dashboard overview; section 20: daily marking).
export async function GET() {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    orderBy: { course: { title: "asc" } },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          attendanceWindowStart: true,
          attendanceWindowEnd: true,
          lateAllowed: true,
        },
      },
    },
  });

  const courseIds = enrollments.map((e) => e.course.id);
  const records = courseIds.length
    ? await prisma.attendance.findMany({
        where: { courseId: { in: courseIds }, studentId: user.id },
        select: { courseId: true, date: true, status: true, markedBy: true },
      })
    : [];

  const byCourse = new Map();
  for (const record of records) {
    if (!byCourse.has(record.courseId)) byCourse.set(record.courseId, []);
    byCourse.get(record.courseId).push(record);
  }

  const today = todayDateString();
  const now = new Date();

  const courses = enrollments.map(({ course }) => {
    const courseRecords = byCourse.get(course.id) ?? [];
    // `date` is a @db.Date column, always round-tripped as UTC midnight for
    // the calendar day it represents — compare via the ISO date slice
    // rather than local getFullYear/Month/Date, which can roll the day
    // back or forward depending on the server's UTC offset.
    const todayRecord = courseRecords.find(
      (r) => new Date(r.date).toISOString().slice(0, 10) === today
    );
    return {
      course,
      todayRecord: todayRecord ?? null,
      withinWindow: isWithinAttendanceWindow(course, now),
      percent: attendancePercent(courseRecords),
      totalRecords: courseRecords.length,
    };
  });

  return NextResponse.json({ courses });
}
