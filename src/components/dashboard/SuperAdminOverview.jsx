"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import StatCard from "@/components/StatCard";
import ListPanel from "@/components/ListPanel";
import StatusBadge from "@/components/StatusBadge";
import QuickActions from "@/components/dashboard/QuickActions";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import OverviewHighlights from "@/components/dashboard/OverviewHighlights";
import {
  BookOpenIcon,
  ClipboardListIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";

const QUICK_ACTIONS = [
  { label: "Add admin", href: "/super-admin/admins", icon: ShieldIcon },
  { label: "View reports", href: "/super-admin/reports", icon: ClipboardListIcon },
  { label: "Manage teachers", href: "/super-admin/teachers", icon: UsersIcon },
  { label: "Manage students", href: "/super-admin/students", icon: UsersIcon },
];

const ROLE_LABEL = { ADMIN: "Admin", TEACHER: "Teacher" };

function timeAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function SuperAdminOverview() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/super-admin/stats");
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

  const { stats, recentAccounts, recentCourses } = data;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Admins" value={stats.totalAdmins} icon={ShieldIcon} accent="text-role-superadmin" />
        <StatCard label="Teachers" value={stats.totalTeachers} icon={UsersIcon} accent="text-role-teacher" />
        <StatCard label="Students" value={stats.totalStudents} icon={UsersIcon} accent="text-role-student" />
        <StatCard
          label="Courses"
          value={`${stats.publishedCourses}/${stats.totalCourses}`}
          icon={BookOpenIcon}
        />
        <StatCard label="Enrollments" value={stats.totalEnrollments} icon={ClipboardListIcon} />
      </div>

      <QuickActions actions={QUICK_ACTIONS} />

      <OverviewHighlights role="super admin" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ListPanel
          title="Recently added accounts"
          items={recentAccounts}
          emptyLabel="No admin or teacher accounts yet."
          accentColor="border-l-role-superadmin"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-700">{item.name}</p>
                <p className="text-xs text-ink-400">{ROLE_LABEL[item.role]}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-400">{timeAgo(item.createdAt)}</span>
            </div>
          )}
        />
        <ListPanel
          title="Recently created courses"
          items={recentCourses}
          emptyLabel="No courses yet."
          accentColor="border-l-role-superadmin"
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-700">{item.title}</p>
                <p className="truncate text-xs text-ink-400">{item.teacher?.name ?? "Unassigned"}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          )}
        />
        <NotificationsPanel accentColor="border-l-role-superadmin" />
      </div>
    </div>
  );
}
