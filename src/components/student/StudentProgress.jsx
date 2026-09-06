"use client";

// Dedicated Progress page for a student (PRD section 24: "Student Progress
// Tracking" — "Course Progress: 72% ... Based on Completed Lectures,
// Watched Videos, Completed Tasks, Submitted Assignments"). Everything
// here reads from GET /api/student/progress, which derives every number
// at request time rather than storing a separate "progress" record.

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import StatCard from "@/components/StatCard";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import {
  BarChartIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
} from "@/components/icons";

export default function StudentProgress() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/progress");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Something went wrong.");
        setData(json);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  if (loadError) return <div className="alert-error">{loadError}</div>;

  if (!data) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading your progress…
      </div>
    );
  }

  const { summary, courses } = data;

  return (
    <div className="space-y-6">
      <StudentPageHeader
        icon={BarChartIcon}
        title="Progress"
        description="How you're doing across every course you're enrolled in."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Average Progress" value={`${summary.averageProgress}%`} icon={GraduationCapIcon} />
        <StatCard
          label="Lectures Watched"
          value={`${summary.lecturesCompleted}/${summary.lecturesTotal}`}
          icon={BookOpenIcon}
        />
        <StatCard
          label="Tasks Completed"
          value={`${summary.tasksCompleted}/${summary.tasksTotal}`}
          icon={ClipboardListIcon}
        />
        <StatCard
          label="Avg. Attendance"
          value={summary.averageAttendance == null ? "\u2014" : `${summary.averageAttendance}%`}
          icon={CalendarCheckIcon}
        />
      </div>

      {courses.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <GraduationCapIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No courses yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Your progress will show up here once you're enrolled in a course.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/student/courses/${course.id}`}
              className="card block border-l-4 border-l-role-student p-5 transition hover:border-brass-200 hover:border-l-role-student hover:shadow-gold"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-display text-base font-semibold text-ink-900">
                  <BookOpenIcon className="h-4 w-4 shrink-0 text-role-student" />
                  {course.title}
                </p>
                <span className="text-sm font-semibold text-brass-600">{course.progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brass-500"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-500">
                <span>
                  {course.completedLectures}/{course.totalLectures} lecture
                  {course.totalLectures === 1 ? "" : "s"} watched
                </span>
                <span>
                  {course.completedTasks}/{course.totalTasks} task
                  {course.totalTasks === 1 ? "" : "s"} completed
                </span>
                <span>
                  Attendance:{" "}
                  {course.attendancePercent == null ? "Not configured" : `${course.attendancePercent}%`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
