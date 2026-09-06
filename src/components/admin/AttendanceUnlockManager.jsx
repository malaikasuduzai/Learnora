"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { LockIcon, CheckCircleIcon } from "@/components/icons";
import { ATTENDANCE_STATUS_META, formatMarkedAt, todayDateString } from "@/lib/attendanceDisplay";

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Admin tool for the "past the edit window" case a teacher can't fix
// themselves (PRD section 5: Admin manages Attendance Settings). A record
// is closed to teacher edits after ATTENDANCE_EDIT_WINDOW_DAYS; this is
// where an Admin grants the one-time exception to correct a genuine
// mistake, the same way a real student-information system gates historical
// grade/attendance changes behind an administrator.
export default function AttendanceUnlockManager({ courses }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [date, setDate] = useState(todayDateString());
  const [roster, setRoster] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [unlockingId, setUnlockingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [justUnlocked, setJustUnlocked] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    setRoster(null);
    setLoadError("");
    setActionError("");
    (async () => {
      try {
        const data = await api(`/api/admin/attendance?courseId=${courseId}&date=${date}`);
        setRoster(data);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, [courseId, date]);

  async function handleUnlock(studentId) {
    setUnlockingId(studentId);
    setActionError("");
    try {
      await api("/api/admin/attendance/unlock", {
        method: "POST",
        body: JSON.stringify({ courseId, studentId, date }),
      });
      setJustUnlocked(studentId);
      setRoster((prev) => ({
        ...prev,
        students: prev.students.map((row) =>
          row.student.id === studentId
            ? { ...row, locked: false, record: { ...row.record, adminUnlocked: true } }
            : row
        ),
      }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUnlockingId(null);
    }
  }

  if (courses.length === 0) {
    return <p className="py-4 text-center text-sm text-ink-400">No courses to review yet.</p>;
  }

  const lockedRows = roster?.students.filter((row) => row.locked) ?? [];
  const otherRows = roster?.students.filter((row) => !row.locked && row.record) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="field-label">Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="field-input">
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Date</label>
          <input
            type="date"
            value={date}
            max={todayDateString()}
            onChange={(e) => setDate(e.target.value)}
            className="field-input w-44"
          />
        </div>
      </div>

      {loadError && <p className="alert-error mb-0">{loadError}</p>}
      {actionError && <p className="alert-error mb-0">{actionError}</p>}

      {!roster && !loadError ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-400">
          <Spinner className="h-4 w-4" /> Loading roster…
        </div>
      ) : roster ? (
        <div className="space-y-3">
          {lockedRows.length === 0 ? (
            <p className="rounded-lg border border-ink-100 border-l-4 border-l-role-admin bg-ink-50/60 py-6 text-center text-sm text-ink-400">
              Nothing locked for {roster.course.title} on {date}.
            </p>
          ) : (
            lockedRows.map((row) => {
              const meta = ATTENDANCE_STATUS_META[row.record.status];
              return (
                <div
                  key={row.student.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-gold"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-xs font-semibold text-role-student">
                      {initials(row.student.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">{row.student.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-ink-400">
                        <LockIcon className="h-3 w-3" /> Marked{" "}
                        <span className={`badge ${meta?.badge}`}>{meta?.label}</span> ·{" "}
                        {formatMarkedAt(row.record.markedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlock(row.student.id)}
                    disabled={unlockingId === row.student.id}
                    className="btn-secondary w-auto px-3.5 text-xs"
                  >
                    {unlockingId === row.student.id ? <Spinner className="h-3.5 w-3.5" /> : "Unlock for teacher"}
                  </button>
                  {justUnlocked === row.student.id && (
                    <span className="flex w-full items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <CheckCircleIcon className="h-3.5 w-3.5" /> Unlocked — the teacher can save one correction.
                    </span>
                  )}
                </div>
              );
            })
          )}

          {otherRows.length > 0 && (
            <details className="rounded-lg border border-ink-100 p-3.5 text-sm text-ink-500">
              <summary className="cursor-pointer select-none font-medium text-ink-600">
                {otherRows.length} other record{otherRows.length === 1 ? "" : "s"} on this date (not locked)
              </summary>
              <ul className="mt-2 space-y-1.5">
                {otherRows.map((row) => {
                  const meta = ATTENDANCE_STATUS_META[row.record.status];
                  return (
                    <li key={row.student.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-ink-700">{row.student.name}</span>
                      <span className={`badge ${meta?.badge}`}>{meta?.label}</span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      ) : null}
    </div>
  );
}
