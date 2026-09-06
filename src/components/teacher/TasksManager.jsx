"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import StatusBadge from "@/components/StatusBadge";
import TaskFormModal from "@/components/teacher/TaskFormModal";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import {
  BarChartIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  ClockIcon,
  FileIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";
import { computeStudentTaskStatus, formatDateTime, STUDENT_TASK_STATUS_META } from "@/lib/taskDisplay";

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.fieldErrors = data.fieldErrors;
    throw err;
  }
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

// "Teacher Task Evaluation" (PRD section 17): change the submission's
// status, assign marks (out of the task's maxMarks) and leave feedback.
// Defaults to "Under review" the first time a Submitted item is opened, so
// clicking Save is enough to move it off the "needs attention" pile even
// before a mark is ready.
function EvaluationForm({ task, submission, onEvaluate }) {
  const [status, setStatus] = useState(submission.status === "SUBMITTED" ? "UNDER_REVIEW" : submission.status);
  const [marks, setMarks] = useState(submission.marks ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onEvaluate(submission.id, {
        status,
        marks: marks === "" ? null : Number(marks),
        feedback,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 border-t border-ink-100 pt-3">
      <p className="font-semibold uppercase tracking-wide text-ink-400">Evaluate submission</p>
      {error && <p className="alert-error mb-0">{error}</p>}
      {saved && <p className="alert-success mb-0">Evaluation saved — the student can see this now.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label text-[11px]">Outcome</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setSaved(false);
            }}
            className="field-input"
          >
            <option value="UNDER_REVIEW">Under review</option>
            <option value="COMPLETED">Approve — Completed</option>
            <option value="REJECTED">Reject</option>
          </select>
        </div>
        <div>
          <label className="field-label text-[11px]">Marks (out of {task.maxMarks})</label>
          <input
            type="number"
            min={0}
            max={task.maxMarks}
            value={marks}
            onChange={(e) => {
              setMarks(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. 85"
            className="field-input"
          />
        </div>
      </div>
      <div>
        <label className="field-label text-[11px]">Feedback</label>
        <textarea
          rows={2}
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            setSaved(false);
          }}
          placeholder="Good implementation. Improve the UI responsiveness and error handling."
          className="field-textarea"
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary w-auto px-4 py-1.5 text-xs">
          {saving ? <Spinner className="h-3.5 w-3.5" /> : "Save evaluation"}
        </button>
      </div>
    </form>
  );
}

function SubmissionCell({ student, submission, task, onEvaluate }) {
  const status = computeStudentTaskStatus(task, submission);
  const meta = STUDENT_TASK_STATUS_META[status];
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-ink-100 border-l-4 border-l-role-teacher transition duration-200 hover:border-brass-200 hover:border-l-role-teacher hover:shadow-gold">
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
          {submission.notes && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-ink-400">Notes</p>
              <p className="mt-1 whitespace-pre-line text-ink-600">{submission.notes}</p>
            </div>
          )}
          <EvaluationForm task={task} submission={submission} onEvaluate={onEvaluate} />
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      try {
        const { task: full } = await api(`/api/teacher/tasks/${task.id}`);
        setDetail(full);
      } catch (err) {
        setLoadError(err.message);
      }
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete task "${task.title}"? This removes every submission too.`)) return;
    setDeleting(true);
    setLoadError("");
    try {
      await onDelete(task.id);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleEvaluate(submissionId, values) {
    const { submission } = await api(`/api/teacher/submissions/${submissionId}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            students: prev.students.map((s) =>
              s.submission?.id === submissionId ? { ...s, submission } : s
            ),
          }
        : prev
    );
    return submission;
  }

  const submittedCount = task._count?.submissions ?? 0;
  const assignedCount = task._count?.assignments ?? 0;

  // "Performance Tracking" (PRD sections 17 & 43): a quick read on how the
  // class did once at least one submission has been graded, computed from
  // whatever detail is currently loaded rather than a separate endpoint.
  const gradedSubmissions = detail
    ? detail.students
        .map((s) => s.submission)
        .filter((s) => s?.status === "COMPLETED" && s.marks != null)
    : [];
  const averageMarks = gradedSubmissions.length
    ? Math.round(
        gradedSubmissions.reduce((sum, s) => sum + s.marks, 0) / gradedSubmissions.length
      )
    : null;

  return (
    <div className="card border-l-4 border-l-role-teacher p-5 transition duration-200 hover:border-brass-200 hover:border-l-role-teacher hover:shadow-gold">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={toggle} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
          {open ? (
            <ChevronDownIcon className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
          ) : (
            <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-ink-900">{task.title}</h3>
              <StatusBadge status={task.status} label={task.status === "DRAFT" ? "Draft" : "Published"} />
            </div>
            <p className="mt-1 text-xs text-ink-400">{task.course.title}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-ink-50/70 px-3 py-2 text-xs text-ink-500">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" /> Due {formatDateTime(task.deadline)}
              </span>
              <span className="flex items-center gap-1">
                <UsersIcon className="h-3.5 w-3.5" /> {assignedCount} assigned
              </span>
              <span className="flex items-center gap-1">
                <ClipboardListIcon className="h-3.5 w-3.5" /> {submittedCount} submitted
              </span>
            </div>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => onEdit(task)} className="btn-ghost px-2 py-1.5" aria-label="Edit task">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost px-2 py-1.5 text-red-500 hover:bg-red-50"
            aria-label="Delete task"
          >
            {deleting ? <Spinner className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {loadError && !open && <p className="alert-error mt-4 mb-0">{loadError}</p>}

      {open && (
        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
          <p className="text-sm text-ink-600">{task.description}</p>
          {loadError && <p className="alert-error">{loadError}</p>}
          {!detail && !loadError ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-400">
              <Spinner className="h-4 w-4" /> Loading submissions…
            </div>
          ) : (
            detail && (
              <div className="space-y-3">
                {averageMarks != null && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-xs font-medium text-ink-600">
                    <BarChartIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    Average score: {averageMarks}/{task.maxMarks} · {gradedSubmissions.length} of{" "}
                    {assignedCount} graded
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Assigned students
                </p>
                {detail.students.length === 0 ? (
                  <p className="text-xs text-ink-400">No students assigned.</p>
                ) : (
                  detail.students.map(({ student, submission }) => (
                    <SubmissionCell
                      key={student.id}
                      student={student}
                      submission={submission}
                      task={task}
                      onEvaluate={handleEvaluate}
                    />
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

export default function TasksManager() {
  const [tasks, setTasks] = useState(null);
  const [courses, setCourses] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [tasksRes, coursesRes] = await Promise.all([
          api("/api/teacher/tasks"),
          api("/api/teacher/courses"),
        ]);
        setTasks(tasksRes.tasks);
        setCourses(coursesRes.courses);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  async function handleCreate(values) {
    const { task } = await api("/api/teacher/tasks", { method: "POST", body: JSON.stringify(values) });
    setTasks((prev) => [...prev, task]);
  }

  async function handleEditSubmit(taskId, values) {
    const { task } = await api(`/api/teacher/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
  }

  async function handleDelete(taskId) {
    await api(`/api/teacher/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function openEdit(task) {
    setEditLoading(true);
    try {
      const { task: full } = await api(`/api/teacher/tasks/${task.id}`);
      setEditingTask({
        id: full.id,
        courseId: full.courseId,
        title: full.title,
        description: full.description,
        instructions: full.instructions,
        startDate: full.startDate,
        deadline: full.deadline,
        maxMarks: full.maxMarks,
        attachmentUrl: full.attachmentUrl,
        status: full.status,
        assignedStudentIds: full.students.map((s) => s.student.id),
      });
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  if (loadError && !tasks) return <div className="alert-error">{loadError}</div>;

  if (!tasks || !courses) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading tasks…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeacherPageHeader
        icon={ClipboardListIcon}
        title="Tasks & submissions"
        description="Create tasks for your courses, set a deadline, and review, mark and give feedback on what students submit."
        action={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={courses.length === 0}
            className="btn-brass w-auto px-4"
          >
            <PlusIcon className="h-4 w-4" />
            Create task
          </button>
        }
      />

      {courses.length === 0 && (
        <div className="alert-error mb-0">
          You don't have any assigned courses yet, so there's nothing to create a task for.
        </div>
      )}

      {editLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-400">
          <Spinner className="h-4 w-4" /> Loading task details…
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <ClipboardListIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No tasks yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Create your first task and assign it to enrolled students.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <TaskFormModal
          courses={courses}
          onClose={() => setShowForm(false)}
          onSubmit={async (values) => {
            await handleCreate(values);
            setShowForm(false);
          }}
        />
      )}
      {editingTask && (
        <TaskFormModal
          courses={courses}
          initial={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={async (values) => {
            await handleEditSubmit(editingTask.id, values);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
