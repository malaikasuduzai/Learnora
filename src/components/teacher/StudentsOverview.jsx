"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "@/components/Spinner";
import SharedStatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import {
  BarChartIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/icons";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
      <div className="h-full rounded-full bg-brass-500" style={{ width: `${value}%` }} />
    </div>
  );
}

function CourseBreakdownRow({ course }) {
  return (
    <div className="rounded-lg border border-ink-100 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-ink-800">{course.courseTitle}</p>
        <span className="shrink-0 text-xs font-semibold text-ink-600">{course.progress}%</span>
      </div>
      <ProgressBar value={course.progress} />
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
        <span className="flex items-center gap-1">
          <BookOpenIcon className="h-3.5 w-3.5 text-ink-400" />
          {course.completedLectures}/{course.totalLectures} lectures
        </span>
        <span className="flex items-center gap-1">
          <ClipboardListIcon className="h-3.5 w-3.5 text-ink-400" />
          {course.tasksCompleted}/{course.tasksTotal} tasks
        </span>
        <span className="flex items-center gap-1">
          <CalendarCheckIcon className="h-3.5 w-3.5 text-ink-400" />
          {course.attendancePercent != null ? `${course.attendancePercent}% attendance` : "No attendance yet"}
        </span>
      </div>
    </div>
  );
}

const TONE_COLOR = {
  brass: "#b8842e",
  brand: "#2568f5",
  emerald: "#0f7a5d",
  ink: "#a9691c",
};

function StatCard({ icon, label, value, tone }) {
  return <SharedStatCard label={label} value={value} icon={icon} color={TONE_COLOR[tone]} />;
}

function averageAttendance(courses) {
  const withData = courses.filter((c) => c.attendancePercent != null);
  if (!withData.length) return null;
  return Math.round(withData.reduce((sum, c) => sum + c.attendancePercent, 0) / withData.length);
}

function StudentRow({ entry }) {
  const [open, setOpen] = useState(false);
  const { student, courses, overallProgress } = entry;
  const avgAttendance = averageAttendance(courses);

  return (
    <div className="card overflow-hidden border-l-4 border-l-role-teacher p-0 transition duration-150 hover:border-brass-200 hover:border-l-role-teacher hover:shadow-gold">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-ink-50/60"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-sm font-semibold text-role-student ring-2 ring-white">
            {initials(student.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-ink-900">{student.name}</p>
              {!student.isActive && <StatusBadge status="NO" label="Deactivated" />}
            </div>
            <p className="truncate text-xs text-ink-400">{student.email}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-ink-700">{overallProgress}% progress</p>
            <p className="text-xs text-ink-400">
              {courses.length} course{courses.length === 1 ? "" : "s"}
              {avgAttendance != null ? ` \u00b7 ${avgAttendance}% attendance` : ""}
            </p>
          </div>
          <div className="hidden h-9 w-24 items-center overflow-hidden rounded-full bg-ink-100 sm:flex">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brass-400 to-brass-600 transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          {open ? (
            <ChevronDownIcon className="h-4 w-4 text-ink-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-ink-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-ink-100 bg-ink-50/40 p-5">
          {courses.map((course) => (
            <CourseBreakdownRow key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentsOverview() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/teacher/students");
        const body = await res.json();
        if (!res.ok) {
          setLoadError(body.error || "Could not load students.");
          return;
        }
        setData(body);
      } catch {
        setLoadError("Could not reach the server.");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    const rows = data.students.filter((entry) => {
      if (courseFilter !== "all" && !entry.courses.some((c) => c.courseId === courseFilter)) return false;
      if (term && !entry.student.name.toLowerCase().includes(term) && !entry.student.email.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });

    const sorted = [...rows];
    if (sortBy === "progress") {
      sorted.sort((a, b) => b.overallProgress - a.overallProgress);
    } else if (sortBy === "attendance") {
      sorted.sort((a, b) => (averageAttendance(b.courses) ?? -1) - (averageAttendance(a.courses) ?? -1));
    } else {
      sorted.sort((a, b) => a.student.name.localeCompare(b.student.name));
    }
    return sorted;
  }, [data, search, courseFilter, sortBy]);

  const stats = useMemo(() => {
    if (!data || data.students.length === 0) {
      return { total: 0, avgProgress: 0, avgAttendance: null, courses: data?.courses.length ?? 0 };
    }
    const total = data.students.length;
    const avgProgress = Math.round(
      data.students.reduce((sum, e) => sum + e.overallProgress, 0) / total
    );
    const attendanceValues = data.students
      .map((e) => averageAttendance(e.courses))
      .filter((v) => v != null);
    const avgAttendance = attendanceValues.length
      ? Math.round(attendanceValues.reduce((sum, v) => sum + v, 0) / attendanceValues.length)
      : null;
    return { total, avgProgress, avgAttendance, courses: data.courses.length };
  }, [data]);

  if (loadError && !data) return <div className="alert-error">{loadError}</div>;

  if (!data) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading students…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={UsersIcon} label="Total students" value={stats.total} tone="brand" />
        <StatCard icon={GraduationCapIcon} label="Courses taught" value={stats.courses} tone="ink" />
        <StatCard icon={BarChartIcon} label="Avg. progress" value={`${stats.avgProgress}%`} tone="brass" />
        <StatCard
          icon={CalendarCheckIcon}
          label="Avg. attendance"
          value={stats.avgAttendance != null ? `${stats.avgAttendance}%` : "\u2014"}
          tone="emerald"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name or email…"
            className="field-input pl-9"
          />
        </div>
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="field-input sm:w-56">
          <option value="all">All courses</option>
          {data.courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="field-input sm:w-48">
          <option value="name">Sort: Name (A–Z)</option>
          <option value="progress">Sort: Progress</option>
          <option value="attendance">Sort: Attendance</option>
        </select>
      </div>

      {data.students.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <UsersIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No students yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Students will appear here as soon as they enroll in one of your courses.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-10 text-center text-sm text-ink-400">No students match those filters.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <StudentRow key={entry.student.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
