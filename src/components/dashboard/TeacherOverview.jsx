"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import ListPanel from "@/components/ListPanel";
import Spinner from "@/components/Spinner";
import OverviewHighlights from "@/components/dashboard/OverviewHighlights";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import {
  BellIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  UsersIcon,
} from "@/components/icons";
import { formatDateTime } from "@/lib/taskDisplay";

export default function TeacherOverview() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/teacher/overview");
        const body = await res.json();
        if (!res.ok) {
          setLoadError(body.error || "Could not load your overview.");
          return;
        }
        setData(body);
      } catch {
        setLoadError("Could not reach the server.");
      }
    })();
  }, []);

  if (loadError) return <div className="alert-error">{loadError}</div>;

  if (!data) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading your overview…
      </div>
    );
  }

  const { stats, pendingSubmissions, upcomingDeadlines } = data;

  const statCards = [
    { label: "Assigned Courses", value: String(stats.assignedCourses), icon: BookOpenIcon },
    { label: "Total Students", value: String(stats.totalStudents), icon: UsersIcon },
    {
      label: "Today's Attendance",
      value: stats.todaysAttendancePercent != null ? `${stats.todaysAttendancePercent}%` : "\u2014",
      icon: CalendarCheckIcon,
    },
    { label: "Pending Submissions", value: String(stats.pendingSubmissions), icon: ClipboardListIcon },
    { label: "Upcoming Tasks", value: String(stats.upcomingTasks), icon: BellIcon },
    { label: "Total Lectures", value: String(stats.totalLectures), icon: BookOpenIcon },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <OverviewHighlights role="teacher" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ListPanel
          title="Pending Submissions"
          items={pendingSubmissions}
          emptyLabel="Nothing waiting on you — all caught up."
          accentColor="border-l-role-teacher"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-700">{item.task}</p>
                <p className="truncate text-xs text-ink-400">
                  {item.student} · {item.course}
                </p>
              </div>
              <span className="badge shrink-0 bg-brass-50 text-brass-700">Review</span>
            </div>
          )}
        />
        <ListPanel
          title="Upcoming Deadlines"
          items={upcomingDeadlines}
          emptyLabel="No upcoming task deadlines."
          accentColor="border-l-role-teacher"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-700">{item.title}</p>
                <p className="truncate text-xs text-ink-400">{item.course}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-ink-400">
                {formatDateTime(item.deadline)}
              </span>
            </div>
          )}
        />
        <NotificationsPanel accentColor="border-l-role-teacher" />
      </div>
    </div>
  );
}
