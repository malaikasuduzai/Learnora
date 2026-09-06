"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import { CalendarCheckIcon, ClockIcon } from "@/components/icons";
import { formatWindow } from "@/lib/attendanceDisplay";

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

function CourseRow({ course, onSave }) {
  const [start, setStart] = useState(course.attendanceWindowStart ?? "");
  const [end, setEnd] = useState(course.attendanceWindowEnd ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const isConfigured = Boolean(course.attendanceWindowStart && course.attendanceWindowEnd);

  // Live validation, checked as the admin types — so the rule is visible
  // immediately instead of only surfacing after a failed save round-trip.
  let liveError = "";
  if (start && end && start >= end) {
    liveError = "End time must be after the start time.";
  } else if ((start && !end) || (!start && end)) {
    liveError = "Both a start and end time are required.";
  }

  const saveDisabledMessage = !start && !end ? "Set a start and end time before saving." : "";

  async function handleSave() {
    if (liveError || saveDisabledMessage) {
      setError(liveError || saveDisabledMessage);
      setSaved(false);
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { course: updated } = await api(`/api/admin/courses/${course.id}/attendance-settings`, {
        method: "PATCH",
        body: JSON.stringify({
          attendanceWindowStart: start,
          attendanceWindowEnd: end,
          lateAllowed: true,
        }),
      });
      onSave(updated);
      setSaved(true);
    } catch (err) {
      setError(err.fieldErrors?.attendanceWindowEnd || err.fieldErrors?.attendanceWindowStart || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-100 border-l-4 border-l-role-admin bg-white p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-brass-200 hover:border-l-role-admin hover:shadow-gold">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900">
            <CalendarCheckIcon className="h-3.5 w-3.5 shrink-0 text-role-admin" />
            {course.title}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            {course.teacher ? `Teacher: ${course.teacher.name}` : "No teacher assigned"}
          </p>
        </div>
        <span className={`badge shrink-0 ${isConfigured ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>
          {isConfigured ? formatWindow(course) : "Not configured"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label text-[11px]">Window start</label>
          <input
            type="time"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setSaved(false);
            }}
            className="field-input w-32"
          />
        </div>
        <div>
          <label className="field-label text-[11px]">Window end</label>
          <input
            type="time"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setSaved(false);
            }}
            className="field-input w-32"
          />
        </div>
        <label className="mb-2.5 flex items-center gap-2 text-xs font-medium text-emerald-600">
          <ClockIcon className="h-3.5 w-3.5" />
          "Late" is open for teachers
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-brass w-auto px-3 py-2 text-xs"
        >
          {saving ? <Spinner className="h-3.5 w-3.5" /> : "Save"}
        </button>
      </div>
      {(liveError || error) && <p className="field-error mt-2">{liveError || error}</p>}
      {saved && <p className="mt-2 text-xs font-medium text-emerald-600">Saved.</p>}
    </div>
  );
}

export default function AttendanceSettingsManager({ initialCourses }) {
  const [courses, setCourses] = useState(initialCourses);

  function handleSave(updated) {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  }

  if (courses.length === 0) {
    return (
      <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
        <CalendarCheckIcon className="h-8 w-8 text-ink-300" />
        <p className="text-sm font-medium text-ink-600">No courses yet</p>
        <p className="max-w-xs text-xs text-ink-400">
          Create a course first, then come back here to set its attendance window.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-3 p-5">
      {courses.map((course) => (
        <CourseRow key={course.id} course={course} onSave={handleSave} />
      ))}
    </div>
  );
}
