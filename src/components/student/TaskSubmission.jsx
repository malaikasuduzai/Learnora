"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import {
  ArrowLeftIcon,
  ClockIcon,
  FileIcon,
  LinkIcon,
} from "@/components/icons";
import {
  DEADLINE_URGENCY_META,
  deadlineUrgency,
  formatDateTime,
  STUDENT_TASK_STATUS_META,
} from "@/lib/taskDisplay";

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

export default function TaskSubmission({ taskId }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const json = await api(`/api/student/tasks/${taskId}`);
      setData(json);
      if (json.submission) {
        setFileUrl(json.submission.fileUrl ?? "");
        setTextAnswer(json.submission.textAnswer ?? "");
        setLink(json.submission.link ?? "");
        setNotes(json.submission.notes ?? "");
      }
    } catch (err) {
      setLoadError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setNotice("");
    setSuccess("");
    try {
      const { submission } = await api(`/api/student/tasks/${taskId}/submit`, {
        method: "POST",
        body: JSON.stringify({ fileUrl, textAnswer, link, notes }),
      });
      setData((prev) => ({ ...prev, submission, status: "SUBMITTED" }));
      setSuccess("Your submission was saved.");
    } catch (err) {
      setErrors(err?.fieldErrors ?? {});
      setNotice(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) return <div className="alert-error">{loadError}</div>;

  if (!data) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading task…
      </div>
    );
  }

  const { task, submission, status } = data;
  const statusMeta = STUDENT_TASK_STATUS_META[status];
  const showUrgency = status === "PENDING" || status === "OVERDUE";
  const urgency = showUrgency ? deadlineUrgency(task.deadline) : null;
  // A submission can only be edited while it's still just "Submitted" —
  // once a teacher moves it to Under Review / Completed / Rejected it's
  // locked (mirrors the check in the submit API route).
  const locked = Boolean(submission) && submission.status !== "SUBMITTED";

  return (
    <div className="space-y-5">
      <Link
        href="/student/tasks"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to tasks
      </Link>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-ink-400">{task.course.title}</p>
            <h1 className="mt-1 font-display text-xl font-semibold text-ink-900">{task.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span>
            {urgency && (
              <span className={`badge ${DEADLINE_URGENCY_META[urgency].badge}`}>
                {DEADLINE_URGENCY_META[urgency].label}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
          <span className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4" /> Deadline: {formatDateTime(task.deadline)}
          </span>
          {task.startDate && <span>Starts: {formatDateTime(task.startDate)}</span>}
          <span>Maximum marks: {task.maxMarks}</span>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm text-ink-700">{task.description}</p>

        {task.instructions && (
          <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Instructions</p>
            <p className="mt-1.5 whitespace-pre-line text-sm text-ink-600">{task.instructions}</p>
          </div>
        )}

        {task.attachmentUrl && (
          <a
            href={task.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brass-700 underline"
          >
            <FileIcon className="h-4 w-4" />
            Reference material
          </a>
        )}

        {submission && (submission.status === "COMPLETED" || submission.status === "REJECTED") && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              submission.status === "COMPLETED"
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                submission.status === "COMPLETED" ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {submission.status === "COMPLETED" ? "Result" : "Submission rejected"}
              {submission.marks != null && ` — ${submission.marks} / ${task.maxMarks}`}
            </p>
            {submission.feedback && (
              <p
                className={`mt-1.5 whitespace-pre-line text-sm ${
                  submission.status === "COMPLETED" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {submission.feedback}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {submission ? "Your submission" : "Submit your work"}
        </h2>

        {locked ? (
          <p className="mt-1.5 text-sm text-ink-500">
            {submission.status === "REJECTED"
              ? "This submission was rejected and can no longer be edited."
              : submission.status === "COMPLETED"
              ? "This submission has been evaluated and can no longer be edited."
              : "This submission is being reviewed by your teacher and can no longer be edited."}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-ink-500">
            Add a file link, a text answer, or a link — whichever fits the task — plus any notes for
            your teacher.
          </p>
        )}

        {notice && <div className="alert-error mt-4">{notice}</div>}
        {success && <div className="alert-success mt-4 mb-0">{success}</div>}

        {locked ? (
          <div className="mt-4 space-y-3 text-sm">
            {submission.fileUrl && (
              <p className="flex items-center gap-1.5 text-ink-600">
                <FileIcon className="h-4 w-4 shrink-0 text-ink-400" />
                <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="truncate underline">
                  {submission.fileUrl}
                </a>
              </p>
            )}
            {submission.link && (
              <p className="flex items-center gap-1.5 text-ink-600">
                <LinkIcon className="h-4 w-4 shrink-0 text-ink-400" />
                <a href={submission.link} target="_blank" rel="noreferrer" className="truncate underline">
                  {submission.link}
                </a>
              </p>
            )}
            {submission.textAnswer && (
              <p className="whitespace-pre-line text-ink-600">{submission.textAnswer}</p>
            )}
            {submission.notes && (
              <p className="whitespace-pre-line text-xs text-ink-400">Notes: {submission.notes}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="sub-file" className="field-label">
                File link <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <input
                id="sub-file"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://… (link to your uploaded file)"
                className={`field-input ${errors.fileUrl ? "field-input-error" : ""}`}
              />
              {errors.fileUrl && <p className="field-error">{errors.fileUrl}</p>}
            </div>

            <div>
              <label htmlFor="sub-text" className="field-label">
                Text answer <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                id="sub-text"
                rows={5}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Write your answer here"
                className={`field-textarea ${errors.textAnswer ? "field-input-error" : ""}`}
              />
              {errors.textAnswer && <p className="field-error">{errors.textAnswer}</p>}
            </div>

            <div>
              <label htmlFor="sub-link" className="field-label">
                Link <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <input
                id="sub-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://… (e.g. a deployed project or repo)"
                className={`field-input ${errors.link ? "field-input-error" : ""}`}
              />
              {errors.link && <p className="field-error">{errors.link}</p>}
            </div>

            <div>
              <label htmlFor="sub-notes" className="field-label">
                Comments / notes <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                id="sub-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want your teacher to know"
                className={`field-textarea ${errors.notes ? "field-input-error" : ""}`}
              />
              {errors.notes && <p className="field-error">{errors.notes}</p>}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="btn-primary w-auto px-5">
                {submitting ? <Spinner className="h-4 w-4" /> : submission ? "Resubmit" : "Submit task"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
