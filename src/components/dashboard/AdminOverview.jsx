"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import StatCard from "@/components/StatCard";
import ListPanel from "@/components/ListPanel";
import QuickActions from "@/components/dashboard/QuickActions";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import OverviewHighlights from "@/components/dashboard/OverviewHighlights";
import {
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  PlusIcon,
  UsersIcon,
} from "@/components/icons";

const QUICK_ACTIONS = [
  { label: "New course", href: "/admin/courses/new", icon: PlusIcon },
  { label: "Add teacher", href: "/admin/teachers", icon: UsersIcon },
  { label: "Add student", href: "/admin/students", icon: UsersIcon },
  { label: "Attendance settings", href: "/admin/attendance", icon: CalendarCheckIcon },
];

function timeAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatDeadline(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const body = await res.json();
        if (!res.ok) {
          setLoadError(body.error || "Could not load dashboard data.");
          return;
        }
        setData(body);
      } catch {
        setLoadError("Could not reach the server.");
      }
    })();
  }, []);

  if (loadError && !data) return <div className="alert-error">{loadError}</div>;

  if (!data) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading overview…
      </div>
    );
  }

  const { stats, recentEnrollments, upcomingDeadlines } = data;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Courses"
          value={`${stats.publishedCourses}/${stats.totalCourses}`}
          icon={BookOpenIcon}
        />
        <StatCard label="Teachers" value={stats.totalTeachers} icon={UsersIcon} accent="text-role-teacher" />
        <StatCard label="Students" value={stats.totalStudents} icon={UsersIcon} accent="text-role-student" />
        <StatCard label="Enrollments" value={stats.totalEnrollments} icon={ClipboardListIcon} />
        <StatCard label="Open submissions" value={stats.openSubmissions} icon={ClipboardListIcon} />
        <StatCard
          label="Today's attendance"
          value={stats.todaysAttendance != null ? `${stats.todaysAttendance}%` : "—"}
          icon={CalendarCheckIcon}
        />
      </div>

      <QuickActions actions={QUICK_ACTIONS} />

      <OverviewHighlights role="admin" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ListPanel
          title="Recent enrollments"
          items={recentEnrollments}
          emptyLabel="No enrollments yet."
          accentColor="border-l-role-admin"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-700">{item.studentName}</p>
                <p className="truncate text-xs text-ink-400">{item.courseTitle}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-400">{timeAgo(item.enrolledAt)}</span>
            </div>
          )}
        />
        <ListPanel
          title="Upcoming deadlines"
          items={upcomingDeadlines}
          emptyLabel="Nothing due soon."
          accentColor="border-l-role-admin"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-700">{item.title}</p>
                <p className="truncate text-xs text-ink-400">{item.courseTitle}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-ink-400">
                {formatDeadline(item.deadline)}
              </span>
            </div>
          )}
        />
        <NotificationsPanel accentColor="border-l-role-admin" />
      </div>
    </div>
  );
}
