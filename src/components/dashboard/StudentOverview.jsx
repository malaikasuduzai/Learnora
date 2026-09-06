"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import ListPanel from "@/components/ListPanel";
import Spinner from "@/components/Spinner"
import OverviewHighlights from "@/components/dashboard/OverviewHighlights";
import StudentCourses from "@/components/student/StudentCourses";
import UpcomingActivitiesPanel from "@/components/dashboard/UpcomingActivitiesPanel";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import { BookOpenIcon, CalendarCheckIcon, CheckCircleIcon, ClipboardListIcon } from "@/components/icons";
import { STUDENT_TASK_STATUS_META } from "@/lib/taskDisplay";

const STATUS_STYLE = STUDENT_TASK_STATUS_META;

export default function StudentOverview() {
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/progress");
        const data = await res.json();
        if (res.ok) setProgress(data.summary);
      } catch {
        // Stat cards just stay in their loading state on failure.
      }
    })();
    (async () => {
      try {
        const res = await fetch("/api/student/tasks");
        const data = await res.json();
        if (res.ok) setTasks(data.tasks);
      } catch {
        // Recent submissions panel just stays in its loading state on failure.
      }
    })();
  }, []);

  const recentSubmissions = (tasks ?? [])
    .filter((t) => t.submission)
    .sort((a, b) => new Date(b.submission.submittedAt) - new Date(a.submission.submittedAt))
    .slice(0, 4);

  const stats = [
    { label: "My Courses", value: progress ? String(progress.coursesEnrolled) : "\u2014", icon: BookOpenIcon },
    { label: "Course Progress", value: progress ? `${progress.averageProgress}%` : "\u2014", icon: CheckCircleIcon },
    {
      label: "Attendance",
      value: progress?.averageAttendance != null ? `${progress.averageAttendance}%` : "\u2014",
      icon: CalendarCheckIcon,
    },
    {
      label: "Pending Tasks",
      value: progress ? String(Math.max(progress.tasksTotal - progress.tasksCompleted, 0)) : "\u2014",
      icon: ClipboardListIcon,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <OverviewHighlights role="student" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card border-l-4 border-l-role-student p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <BookOpenIcon className="h-4.5 w-4.5 text-role-student" />
              My Courses
            </h2>
            <StudentCourses limit={4} />
          </div>

          {tasks === null ? (
            <div className="card flex items-center justify-center gap-2 py-10 text-sm text-ink-400">
              <Spinner className="h-4 w-4" /> Loading recent submissions…
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="card py-8 text-center text-sm text-ink-400">
              No submissions yet — they'll show up here once you submit a task.
            </div>
          ) : (
            <ListPanel
              title="Recent Submissions"
              items={recentSubmissions}
              accentColor="border-l-role-student"
              renderItem={(item) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-600">{item.title}</p>
                    <p className="truncate text-xs text-ink-400">{item.course.title}</p>
                  </div>
                  <span className={`badge shrink-0 ${STATUS_STYLE[item.status]?.badge ?? STATUS_STYLE.PENDING.badge}`}>
                    {STATUS_STYLE[item.status]?.label ?? item.status}
                  </span>
                </div>
              )}
            />
          )}
        </div>

        <div className="space-y-5">
          <UpcomingActivitiesPanel accentColor="border-l-role-student" />
          <NotificationsPanel accentColor="border-l-role-student" />
        </div>
      </div>
    </div>
  );
}
