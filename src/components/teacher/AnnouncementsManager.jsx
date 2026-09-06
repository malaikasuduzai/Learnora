"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import { BellIcon, PlusIcon, TrashIcon } from "@/components/icons";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import { formatRelativeTime } from "@/lib/communicationDisplay";

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

function ComposeModal({ courses, onClose, onCreated }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitError("");
    setSaving(true);
    try {
      const { announcement } = await api("/api/teacher/announcements", {
        method: "POST",
        body: JSON.stringify({ courseId, title, body }),
      });
      onCreated(announcement);
      onClose();
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      else setSubmitError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New announcement"
      description="Every student currently enrolled in this course will be notified."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="field-input">
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {errors.courseId && <p className="field-error">{errors.courseId}</p>}
        </div>
        <div>
          <label className="field-label">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tomorrow's live lecture will start at 7:00 PM"
            className={`field-input ${errors.title ? "field-input-error" : ""}`}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div>
          <label className="field-label">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Add the details students need to know…"
            className={`field-textarea ${errors.body ? "field-input-error" : ""}`}
          />
          {errors.body && <p className="field-error">{errors.body}</p>}
        </div>
        {submitError && <p className="alert-error mb-0">{submitError}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary w-auto px-4">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary w-auto px-4">
            {saving ? <Spinner className="h-4 w-4" /> : "Publish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AnnouncementsManager() {
  const [courses, setCourses] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, announcementsRes] = await Promise.all([
          api("/api/teacher/courses"),
          api("/api/teacher/announcements"),
        ]);
        setCourses(coursesRes.courses);
        setAnnouncements(announcementsRes.announcements);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete the announcement "${title}"? Students won't be able to see it anymore.`)) {
      return;
    }
    setDeletingId(id);
    setLoadError("");
    try {
      await api(`/api/teacher/announcements/${id}`, { method: "DELETE" });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setDeletingId("");
    }
  }

  if (loadError && !announcements) return <div className="alert-error">{loadError}</div>;

  if (!courses || !announcements) {
    return (
      <div className="card card-hover flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading announcements…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeacherPageHeader
        icon={BellIcon}
        title="Announcements"
        description="Publish updates to everyone enrolled in one of your courses."
        action={
          courses.length > 0 && (
            <button type="button" onClick={() => setShowCompose(true)} className="btn-brass w-auto px-4">
              <PlusIcon className="h-4 w-4" />
              New announcement
            </button>
          )
        }
      />

      {loadError && announcements && <div className="alert-error">{loadError}</div>}

      {courses.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <BellIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No assigned courses</p>
          <p className="max-w-xs text-xs text-ink-400">
            You'll be able to publish announcements once an Admin assigns you to a course.
          </p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <BellIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No announcements yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Publish your first announcement and enrolled students will be notified right away.
          </p>
        </div>
      ) : (
        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="card card-hover flex gap-4 border-l-4 border-l-role-teacher p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-role-teacherSoft text-role-teacher">
                <BellIcon className="h-4.5 w-4.5" />
              </span>
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-semibold text-ink-900">{a.title}</p>
                    <span className="badge bg-ink-100 text-ink-500">{a.course.title}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-600">{a.body}</p>
                  <p className="mt-2 text-xs text-ink-400">{formatRelativeTime(a.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id, a.title)}
                  disabled={deletingId === a.id}
                  className="btn-ghost shrink-0 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete announcement"
                >
                  {deletingId === a.id ? <Spinner className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCompose && (
        <ComposeModal
          courses={courses}
          onClose={() => setShowCompose(false)}
          onCreated={(a) => setAnnouncements((prev) => [a, ...prev])}
        />
      )}
    </div>
  );
}
