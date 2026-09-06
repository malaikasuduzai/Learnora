"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "@/components/Spinner";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import {
  BarChartIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  ClockIcon,
  FileIcon,
  LinkIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/icons";
import { formatDateTime, STUDENT_TASK_STATUS_META, computeStudentTaskStatus } from "@/lib/taskDisplay";

async function api(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Read-only mirror of the Teacher's SubmissionCell — shows what a student
// submitted and how it was graded, with no way to change the outcome. An
// Admin observes; only the course's own teacher evaluates.
function SubmissionCell({ student, submission, task }) {
  const status = computeStudentTaskStatus(task, submission);
  const meta = STUDENT_TASK_STATUS_META[status];
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-ink-100 border-l-4 border-l-role-admin">
      <button
        type="button"
        onClick={() => submission && setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left ${
          submission ? "" : "cursor-default"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-[11px] font-semibold text-role-student">
            {initials(student.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-800">{student.name}</p>
            <p className="truncate text-xs text-ink-400">
              {submission ? `Submitted ${formatDateTime(submission.submittedAt)}` : "Not submitted yet"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {submission?.marks != null && (
            <span className="text-xs font-semibold text-ink-500">
              {submission.marks}/{task.maxMarks}
            </span>
          )}
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
          {submission &&
            (open ? (
              <ChevronDownIcon className="h-3.5 w-3.5 text-ink-400" />
            ) : (
              <ChevronRightIcon className="h-3.5 w-3.5 text-ink-400" />
            ))}
        </div>
      </button>
      {open && submission && (
        <div className="space-y-2 border-t border-ink-100 px-3 py-3 text-xs">
          {submission.fileUrl && (
            <p className="flex items-center gap-1.5 text-ink-600">
              <FileIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="truncate underline">
                {submission.fileUrl}
              </a>
            </p>
          )}
          {submission.link && (
            <p className="flex items-center gap-1.5 text-ink-600">
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              <a href={submission.link} target="_blank" rel="noreferrer" className="truncate underline">
                {submission.link}
              </a>
            </p>
          )}
          {submission.textAnswer && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-ink-400">Answer</p>
              <p className="mt-1 whitespace-pre-line text-ink-600">{submission.textAnswer}</p>
            </div>
          )}
          {submission.feedback && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-ink-400">Teacher feedback</p>
              <p className="mt-1 whitespace-pre-line text-ink-600">{submission.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState("");

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      try {
        const { task: full } = await api(`/api/admin/tasks/${task.id}`);
        setDetail(full);
      } catch (err) {
        setLoadError(err.message);
      }
    }
  }

  return (
    <div className="card overflow-hidden border-l-4 border-l-role-admin p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brass-200 hover:border-l-role-admin hover:shadow-gold">
      <button type="button" onClick={toggle} className="flex w-full items-start justify-between gap-4 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brass-50 text-brass-600">
          <ClipboardListIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-ink-900">{task.title}</h3>
            <StatusBadge status={task.status} label={task.status === "DRAFT" ? "Draft" : "Published"} />
          </div>
          <p className="mt-1 text-xs text-ink-400">
            {task.course.title} · {task.course.teacher?.name ?? "Unassigned teacher"}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-ink-50/70 px-3 py-2 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" /> Due {formatDateTime(task.deadline)}
            </span>
            <span className="flex items-center gap-1">
              <UsersIcon className="h-3.5 w-3.5" /> {task.assignedCount} assigned
            </span>
            <span className="flex items-center gap-1">
              <ClipboardListIcon className="h-3.5 w-3.5" /> {task.submittedCount} submitted
            </span>
            {task.averageMarks != null && (
              <span className="flex items-center gap-1">
                <BarChartIcon className="h-3.5 w-3.5" /> Avg {task.averageMarks}/{task.maxMarks} ·{" "}
                {task.gradedCount} graded
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 pt-1">
          {open ? (
            <ChevronDownIcon className="h-4 w-4 text-ink-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-ink-400" />
          )}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
          {loadError && <p className="alert-error">{loadError}</p>}
          {!detail && !loadError ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-400">
              <Spinner className="h-4 w-4" /> Loading submissions…
            </div>
          ) : (
            detail && (
              <div className="space-y-3">
                <p className="text-sm text-ink-600">{detail.description}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Assigned students
                </p>
                {detail.students.length === 0 ? (
                  <p className="text-xs text-ink-400">No students assigned.</p>
                ) : (
                  detail.students.map(({ student, submission }) => (
                    <SubmissionCell key={student.id} student={student} submission={submission} task={task} />
                  ))
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function TasksOverview() {
  const [tasks, setTasks] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const { tasks: data } = await api("/api/admin/tasks");
        setTasks(data);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  const courseOptions = useMemo(() => {
    if (!tasks) return [];
    const map = new Map();
    for (const task of tasks) map.set(task.course.id, task.course.title);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    const term = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (courseFilter !== "all" && task.course.id !== courseFilter) return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (term && !task.title.toLowerCase().includes(term) && !task.course.title.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [tasks, search, courseFilter, statusFilter]);

  if (loadError && !tasks) return <div className="alert-error">{loadError}</div>;

  if (!tasks) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading tasks…
      </div>
    );
  }

  const now = Date.now();
  const taskSummary = { total: tasks.length, published: tasks.filter(t => t.status === "PUBLISHED").length, submissions: tasks.reduce((n,t) => n + (t.submittedCount || 0), 0), overdue: tasks.filter(t => t.deadline && new Date(t.deadline).getTime() < now && t.status === "PUBLISHED").length };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Total tasks", taskSummary.total, ClipboardListIcon, "#2568f5"],
          ["Published", taskSummary.published, BarChartIcon, "#0f7a5d"],
          ["Submissions", taskSummary.submissions, UsersIcon, "#b8842e"],
          ["Overdue", taskSummary.overdue, ClockIcon, "#c0392b"],
        ].map(([label, value, Icon, color]) => (
          <StatCard key={label} label={label} value={value} icon={Icon} color={color} />
        ))}
      </div>
      <div className="card card-hover p-4 sm:p-5">
        <div className="mb-3"><p className="text-sm font-semibold text-ink-900">Find a task</p><p className="mt-0.5 text-xs text-ink-400">Filter by task, course or publication status.</p></div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or courses…"
            className="field-input pl-9"
          />
        </div>
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="field-input sm:w-56">
          <option value="all">All courses</option>
          {courseOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field-input sm:w-40">
          <option value="all">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>
      </div>

      {tasks.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <ClipboardListIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No tasks yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Tasks appear here as soon as a teacher creates one on their course.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-10 text-center text-sm text-ink-400">No tasks match those filters.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
