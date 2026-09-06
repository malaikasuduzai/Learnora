import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { flattenLectures, computeLectureStatuses } from "@/lib/courseContent";
import { isWithinAttendanceWindow, todayDateString } from "@/lib/attendanceDisplay";

function formatDeadline(value) {
  const due = new Date(value);
  const diffHrs = (due.getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHrs <= 24) return "Due today";
  if (diffHrs <= 48) return "Due tomorrow";
  return `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

// GET /api/student/upcoming — a single combined feed for the "Upcoming
// Activities" panel on the student dashboard (PRD section 31: "Upcoming
// Lectures, Task Deadlines, Attendance Window, Scheduled Classes,
// Announcements"). Assembled at read time from the same models the rest of
// the app already uses — lectures/progress (Day 4), tasks/submissions
// (Day 5), attendance (Day 7) and announcements (Day 8) — rather than a
// separate "activity feed" model.
export async function GET() {
  const { user, error } = await requireRole(["STUDENT"]);
  if (error) return NextResponse.json({ error: error.message }, { status: error.status });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id, status: "ACTIVE" },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          attendanceWindowStart: true,
          attendanceWindowEnd: true,
          modules: {
            select: {
              id: true,
              order: true,
              title: true,
              lectures: { select: { id: true, title: true, order: true } },
            },
          },
        },
      },
    },
  });
  const courseIds = enrollments.map((e) => e.course.id);
  const items = [];

  // 1) Next lecture to watch, per enrolled course.
  if (courseIds.length) {
    const progress = await prisma.lectureProgress.findMany({
      where: { studentId: user.id, lecture: { module: { courseId: { in: courseIds } } } },
      select: { lectureId: true },
    });
    const completedIds = new Set(progress.map((p) => p.lectureId));
    for (const { course } of enrollments) {
      const flat = flattenLectures(course.modules);
      if (!flat.length) continue;
      const statuses = computeLectureStatuses(flat, completedIds);
      const next = flat.find((l) => statuses.get(l.id) === "in_progress");
      if (next) {
        items.push({
          type: "LECTURE",
          icon: "🎬",
          title: next.title,
          detail: course.title,
          when: "Up next",
          link: `/student/courses/${course.id}`,
          sortKey: 0,
        });
      }
    }
  }

  // 2) Task deadlines still ahead (assigned, not yet submitted, not overdue).
  if (courseIds.length) {
    const [assignments, submissions] = await Promise.all([
      prisma.taskAssignment.findMany({
        where: { studentId: user.id, task: { courseId: { in: courseIds }, status: "PUBLISHED" } },
        select: {
          task: { select: { id: true, title: true, deadline: true, course: { select: { title: true } } } },
        },
      }),
      prisma.taskSubmission.findMany({ where: { studentId: user.id }, select: { taskId: true } }),
    ]);
    const submittedIds = new Set(submissions.map((s) => s.taskId));
    const now = Date.now();
    for (const { task } of assignments) {
      if (submittedIds.has(task.id)) continue;
      const due = new Date(task.deadline).getTime();
      if (due < now) continue;
      items.push({
        type: "TASK",
        icon: "📝",
        title: task.title,
        detail: task.course.title,
        when: formatDeadline(task.deadline),
        link: `/student/tasks/${task.id}`,
        sortKey: due,
      });
    }
  }

  // 3) Today's attendance window, for courses with one configured that
  // haven't been marked yet today.
  if (courseIds.length) {
    const today = todayDateString();
    const markedToday = await prisma.attendance.findMany({
      where: { studentId: user.id, courseId: { in: courseIds }, date: new Date(today) },
      select: { courseId: true },
    });
    const markedSet = new Set(markedToday.map((m) => m.courseId));
    for (const { course } of enrollments) {
      if (!course.attendanceWindowStart || markedSet.has(course.id)) continue;
      items.push({
        type: "ATTENDANCE",
        icon: isWithinAttendanceWindow(course) ? "🟢" : "⏳",
        title: "Attendance window",
        detail: course.title,
        when: `${course.attendanceWindowStart} \u2013 ${course.attendanceWindowEnd}`,
        link: "/student/attendance",
        sortKey: 1,
      });
    }
  }

  // 4) The single latest course announcement.
  if (courseIds.length) {
    const announcement = await prisma.announcement.findFirst({
      where: { courseId: { in: courseIds } },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { title: true } } },
    });
    if (announcement) {
      items.push({
        type: "ANNOUNCEMENT",
        icon: "📢",
        title: announcement.title,
        detail: announcement.course.title,
        when: "Announcement",
        link: "/student/announcements",
        sortKey: 2,
      });
    }
  }

  items.sort((a, b) => a.sortKey - b.sortKey);

  return NextResponse.json({ items: items.slice(0, 6) });
}
