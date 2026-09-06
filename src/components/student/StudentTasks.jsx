"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { BookOpenIcon, ChevronRightIcon, ClipboardListIcon, ClockIcon } from "@/components/icons";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import {
  DEADLINE_URGENCY_META,
  deadlineUrgency,
  formatDateTime,
  STUDENT_TASK_STATUS_META,
} from "@/lib/taskDisplay";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "OVERDUE", label: "Overdue" },
];

export default function StudentTasks() {
  const [tasks, setTasks] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/tasks");
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error || "Could not load your tasks.");
          return;
        }
        setTasks(data.tasks);
      } catch {
        setLoadError("Could not reach the server.");
      }
    })();
  }, []);

  const visible = useMemo(() => {
    if (!tasks) return [];
    if (filter === "ALL") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  // "Performance Tracking" (PRD section 24/43): a quick read on graded work
  // across every task, so a student doesn't have to open each one to see
  // how they're doing overall.
  const graded = useMemo(
    () => (tasks ?? []).filter((t) => t.status === "COMPLETED" && t.submission?.marks != null),
    [tasks]
  );
  const averagePercent = graded.length
    ? Math.round(
        (graded.reduce((sum, t) => sum + t.submission.marks / t.maxMarks, 0) / graded.length) * 100
      )
    : null;

  if (loadError) return <div className="alert-error">{loadError}</div>;

  if (!tasks) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading your tasks…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StudentPageHeader
        icon={ClipboardListIcon}
        title="Tasks"
        description="Everything assigned to you, across every course you're enrolled in."
      />

      {averagePercent != null && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Average score
            </span>
            <p className="font-display text-3xl font-semibold text-ink-900">{averagePercent}%</p>
          </div>
          <div className="stat-card">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Tasks graded
            </span>
            <p className="font-display text-3xl font-semibold text-ink-900">{graded.length}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`badge transition ${
              filter === f.value ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <ClipboardListIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No tasks here</p>
          <p className="max-w-xs text-xs text-ink-400">
            {filter === "ALL"
              ? "Once a teacher assigns you a task, it will show up here."
              : "Nothing matches this filter right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((task) => {
            const meta = STUDENT_TASK_STATUS_META[task.status];
            const showUrgency = task.status === "PENDING" || task.status === "OVERDUE";
            const urgency = showUrgency ? deadlineUrgency(task.deadline) : null;
            return (
              <Link
                key={task.id}
                href={`/student/tasks/${task.id}`}
                className="card flex items-center justify-between gap-3 border-l-4 border-l-role-student p-4 transition hover:border-brass-200 hover:border-l-role-student hover:shadow-gold sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-semibold text-ink-900">
                      {task.title}
                    </h3>
                    <span className={`badge ${meta.badge}`}>{meta.label}</span>
                    {task.submission?.marks != null && (
                      <span className="text-xs font-semibold text-ink-500">
                        {task.submission.marks}/{task.maxMarks}
                      </span>
                    )}
                    {urgency && (
                      <span className={`badge ${DEADLINE_URGENCY_META[urgency].badge}`}>
                        {DEADLINE_URGENCY_META[urgency].label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-ink-400">
                    <BookOpenIcon className="h-3.5 w-3.5 shrink-0 text-role-student" />
                    {task.course.title}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                    <ClockIcon className="h-3.5 w-3.5" />
                    Deadline: {formatDateTime(task.deadline)}
                  </p>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
