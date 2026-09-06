"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { BarChartIcon, BookOpenIcon, CalendarCheckIcon, ClipboardListIcon, UsersIcon } from "@/components/icons";

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
      <div className="h-full rounded-full bg-brass-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function ReportsOverview() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/super-admin/reports");
        const body = await res.json();
        if (!res.ok) {
          setLoadError(body.error || "Could not load reports.");
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
        <Spinner className="h-4 w-4" /> Loading reports…
      </div>
    );
  }

  const { summary, courses } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Admins / Teachers"
          value={`${summary.totalAdmins} / ${summary.totalTeachers}`}
          icon={UsersIcon}
        />
        <StatCard label="Students" value={summary.totalStudents} icon={UsersIcon} accent="text-role-student" />
        <StatCard
          label="Courses"
          value={`${summary.publishedCourses}/${summary.totalCourses}`}
          icon={BookOpenIcon}
          accent="text-role-admin"
        />
        <StatCard label="Enrollments" value={summary.totalEnrollments} icon={ClipboardListIcon} />
        <StatCard
          label="Tasks"
          value={`${summary.publishedTasks}/${summary.totalTasks}`}
          icon={ClipboardListIcon}
          accent="text-role-teacher"
        />
        <StatCard
          label="Submissions graded"
          value={`${summary.completedSubmissions}/${summary.totalSubmissions}`}
          icon={BarChartIcon}
        />
        <StatCard label="Avg. lecture completion" value={`${summary.avgLectureCompletion}%`} icon={BookOpenIcon} />
        <StatCard
          label="Avg. attendance"
          value={summary.avgAttendance != null ? `${summary.avgAttendance}%` : "—"}
          icon={CalendarCheckIcon}
        />
      </div>

      <div className="card p-5 sm:p-6">
        <p className="eyebrow">Report areas</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">Platform health at a glance</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [BookOpenIcon, "Course delivery", "Published courses and enrollment activity"],
            [BarChartIcon, "Learning progress", "Lecture completion and task performance"],
            [CalendarCheckIcon, "Attendance", "Attendance activity across enrolled courses"],
            [UsersIcon, "Enrollment & growth", "How students, teachers and courses are scaling over time"],
          ].map(([Icon, title, body]) => (
            <div
              key={title}
              className="group rounded-xl border border-ink-100 bg-ink-50/50 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brass-200 hover:bg-brass-50 hover:shadow-card"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brass-600 shadow-sm transition group-hover:bg-brass-500 group-hover:text-white">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink-900">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-ink-100 px-5 py-4">
          <h3 className="font-display text-base font-semibold text-ink-900">Per-course breakdown</h3>
          <p className="mt-1 text-xs text-ink-500">Averaged across every enrolled student.</p>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <BookOpenIcon className="h-8 w-8 text-ink-300" />
            <p className="text-sm font-medium text-ink-600">No courses yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Teacher</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Students</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Attendance</th>
                  <th className="px-5 py-3 font-medium">Tasks completed</th>
                  <th className="px-5 py-3 font-medium">Avg. score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {courses.map((course) => (
                  <tr key={course.id} className="transition-colors hover:bg-role-superadminSoft/50">
                    <td className="border-l-4 border-l-role-superadmin px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4 shrink-0 text-role-superadmin" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-900">{course.title}</p>
                          {course.categoryName && <p className="text-xs text-ink-400">{course.categoryName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">{course.teacherName ?? "Unassigned"}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">{course.enrolledCount}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={course.avgProgress} />
                        <span className="text-xs font-medium text-ink-500">{course.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">
                      {course.avgAttendance != null ? `${course.avgAttendance}%` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">
                      {course.totalTasks === 0 ? "—" : `${course.taskCompletionRate ?? 0}%`}
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">{course.avgScore != null ? `${course.avgScore}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
