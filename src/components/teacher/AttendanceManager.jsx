"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { CalendarCheckIcon, CheckCircleIcon, ClockIcon, LockIcon, UsersIcon, XCircleIcon } from "@/components/icons";
import TeacherPageHeader from "@/components/teacher/TeacherPageHeader";
import { ATTENDANCE_STATUS_META, formatMarkedAt, formatWindow, todayDateString } from "@/lib/attendanceDisplay";

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

function SummaryPanel({ courseId }) {
  const [rows, setRows] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setRows(null);
    setLoadError("");
    (async () => {
      try {
        const { students } = await api(`/api/teacher/courses/${courseId}/attendance/summary`);
        setRows(students);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, [courseId]);

  if (loadError) return <p className="alert-error mb-0">{loadError}</p>;

  if (!rows) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading summary…
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-ink-400">No students enrolled in this course yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <th className="py-2 pr-3">Student</th>
            <th className="px-3 py-2 text-center">Present</th>
            <th className="px-3 py-2 text-center">Late</th>
            <th className="px-3 py-2 text-center">Absent</th>
            <th className="py-2 pl-3 text-right">Attendance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row) => (
            <tr key={row.student.id}>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-[11px] font-semibold text-role-student">
                    {initials(row.student.name)}
                  </span>
                  <span className="truncate font-medium text-ink-800">{row.student.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center text-ink-600">{row.present}</td>
              <td className="px-3 py-2.5 text-center text-ink-600">{row.late}</td>
              <td className="px-3 py-2.5 text-center text-ink-600">{row.absent}</td>
              <td className="py-2.5 pl-3 text-right font-semibold text-ink-800">
                {row.total ? `${row.percent}%` : "\u2014"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusButton({ active, onClick, tone, label, letter }) {
  const toneClasses = {
    emerald: "border-emerald-600 bg-emerald-600 text-white shadow-sm",
    amber: "border-amber-500 bg-amber-500 text-white shadow-sm",
    red: "border-red-600 bg-red-600 text-white shadow-sm",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold transition ${
        active
          ? toneClasses[tone]
          : "border-ink-200 bg-white text-ink-300 hover:border-ink-300 hover:text-ink-500"
      }`}
    >
      {letter}
    </button>
  );
}

// The live session code a student must enter to self-mark present (see
// lib/attendanceCode.js). Only meaningful for *today*: attendance for a
// past date is always taken by the teacher directly in the roster below,
// so the parent only renders this when `date === todayDateString()`.
function SessionCodePanel({ courseId }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSession(null);
    setCodeError("");
    (async () => {
      try {
        const { session: current } = await api(`/api/teacher/courses/${courseId}/attendance/code`);
        if (!cancelled) setSession(current);
      } catch (err) {
        if (!cancelled) setCodeError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (!session) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setSession(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  async function handleGenerate() {
    setGenerating(true);
    setCodeError("");
    try {
      const { session: fresh } = await api(`/api/teacher/courses/${courseId}/attendance/code`, {
        method: "POST",
      });
      setSession(fresh);
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="card flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-role-teacher p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass-50 text-brass-600">
          <LockIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-800">Attendance code</p>
          {loading ? (
            <p className="text-xs text-ink-400">Loading…</p>
          ) : session ? (
            <p className="text-xs text-ink-400">
              Share this with the class — expires in {mins}:{secs}
            </p>
          ) : (
            <p className="text-xs text-ink-400">
              Generate a code and display it so students can self-mark present.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {session && (
          <span className="rounded-lg border border-brass-200 bg-brass-50 px-4 py-2 font-display text-2xl font-semibold tracking-[0.3em] text-brass-700">
            {session.code}
          </span>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary w-auto px-4"
        >
          {generating ? <Spinner className="h-4 w-4" /> : session ? "New code" : "Generate code"}
        </button>
      </div>

      {codeError && <p className="field-error mb-0 w-full">{codeError}</p>}
    </div>
  );
}

export default function AttendanceManager() {
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(todayDateString());
  const [roster, setRoster] = useState(null);
  const [selections, setSelections] = useState({});
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lockedStudentIds, setLockedStudentIds] = useState([]);
  const [requestingUnlockId, setRequestingUnlockId] = useState(null);
  const [unlockRequestedIds, setUnlockRequestedIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { courses: list } = await api("/api/teacher/courses");
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setRoster(null);
    setSaved(false);
    setSaveError("");
    setLockedStudentIds([]);
    setUnlockRequestedIds([]);
    (async () => {
      try {
        const data = await api(`/api/teacher/courses/${courseId}/attendance?date=${date}`);
        setRoster(data);
        const initial = {};
        for (const row of data.students) {
          initial[row.student.id] = row.record?.status ?? "PRESENT";
        }
        setSelections(initial);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, [courseId, date]);

  async function handleRequestUnlock(studentId) {
    setRequestingUnlockId(studentId);
    setSaveError("");
    try {
      await api(`/api/teacher/courses/${courseId}/attendance/request-unlock`, {
        method: "POST",
        body: JSON.stringify({ studentId, date }),
      });
      setUnlockRequestedIds((prev) => [...prev, studentId]);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setRequestingUnlockId(null);
    }
  }

  const isFutureDate = date > todayDateString();

  async function handleSave() {
    if (isFutureDate) {
      setSaveError("Attendance can't be taken for a future date.");
      setSaved(false);
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const records = Object.entries(selections).map(([studentId, status]) => ({ studentId, status }));
      const result = await api(`/api/teacher/courses/${courseId}/attendance`, {
        method: "POST",
        body: JSON.stringify({ date, records }),
      });
      setLockedStudentIds(result.lockedStudentIds ?? []);
      setSaved(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadError && !courses) return <div className="alert-error">{loadError}</div>;

  if (!courses) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading attendance…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeacherPageHeader
        icon={CalendarCheckIcon}
        title="Attendance"
        description="You can correct a record for 3 days after it's marked. After that it locks and needs an Admin to unlock it for one more edit."
      />

      {courses.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <CalendarCheckIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No assigned courses</p>
          <p className="max-w-xs text-xs text-ink-400">
            You'll be able to take attendance once an Admin assigns you to a course.
          </p>
        </div>
      ) : (
        <>
          <div className="card flex flex-wrap items-end gap-3 border-l-4 border-l-role-teacher p-5">
            <div className="min-w-[220px] flex-1">
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
            <button
              type="button"
              onClick={() => setShowSummary((v) => !v)}
              className="btn-primary w-auto px-4"
            >
              {showSummary ? "Hide summary" : "View summary"}
            </button>
          </div>

          {showSummary && (
            <div className="card border-l-4 border-l-role-teacher p-5">
              <h3 className="mb-3 font-display text-base font-semibold text-ink-900">
                Attendance summary
              </h3>
              <SummaryPanel courseId={courseId} />
            </div>
          )}

          {loadError && <p className="alert-error">{loadError}</p>}

          {!roster ? (
            <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
              <Spinner className="h-4 w-4" /> Loading roster…
            </div>
          ) : (
            <div className="space-y-5">
              {date === todayDateString() && courseId && <SessionCodePanel courseId={courseId} />}

              <div className="card border-l-4 border-l-role-teacher p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-role-teacher" />
                  <h3 className="font-display text-base font-semibold text-ink-900">
                    {roster.course.title} — roster
                  </h3>
                </div>
                <span className="badge bg-ink-100 text-ink-500">
                  Window: {formatWindow(roster.course)}
                </span>
              </div>

              {roster.students.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-400">
                  No students enrolled in this course yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-ink-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-100 bg-ink-50/60 text-xs font-semibold uppercase tracking-wide text-ink-400">
                        <th className="py-2.5 pl-3.5 pr-3">Student</th>
                        <th className="w-20 px-2 py-2.5 text-center">
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                            Present
                          </span>
                        </th>
                        <th className="w-20 px-2 py-2.5 text-center">
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                            Late
                          </span>
                        </th>
                        <th className="w-20 px-2 py-2.5 text-center">
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <XCircleIcon className="h-3.5 w-3.5 text-red-500" />
                            Absent
                          </span>
                        </th>
                        <th className="py-2.5 pl-3 pr-3.5 text-right">Last update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {roster.students.map(({ student, record, locked }) => {
                        const status = selections[student.id] ?? "PRESENT";
                        const justFailedToSave = lockedStudentIds.includes(student.id);
                        const requested = unlockRequestedIds.includes(student.id);
                        const meta = record ? ATTENDANCE_STATUS_META[record.status] : null;

                        if (locked) {
                          return (
                            <tr
                              key={student.id}
                              className="align-middle bg-ink-50/40 transition-colors hover:bg-role-teacherSoft/50"
                            >
                              <td className="py-2 pl-3.5 pr-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-xs font-semibold text-role-student">
                                    {initials(student.name)}
                                  </span>
                                  <p className="truncate text-sm font-medium text-ink-800">{student.name}</p>
                                </div>
                              </td>
                              <td colSpan={2} className="px-2 py-2 text-center">
                                <span className={`badge inline-flex items-center gap-1 ${meta?.badge}`}>
                                  {meta?.label}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-400">
                                  <LockIcon className="h-3.5 w-3.5" /> Locked
                                </span>
                              </td>
                              <td className="py-2 pl-3 pr-3.5 text-right">
                                {requested || justFailedToSave ? (
                                  <span className="text-xs font-medium text-brass-600">
                                    {requested ? "Unlock requested" : "Not saved \u2014 locked"}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRequestUnlock(student.id)}
                                    disabled={requestingUnlockId === student.id}
                                    className="text-xs font-semibold text-role-teacher hover:underline"
                                  >
                                    {requestingUnlockId === student.id ? "Requesting…" : "Request unlock"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={student.id}
                            className="align-middle transition-colors hover:bg-role-teacherSoft/50"
                          >
                            <td className="py-2 pl-3.5 pr-3">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-xs font-semibold text-role-student">
                                  {initials(student.name)}
                                </span>
                                <p className="truncate text-sm font-medium text-ink-800">{student.name}</p>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <StatusButton
                                active={status === "PRESENT"}
                                onClick={() =>
                                  setSelections((prev) => ({ ...prev, [student.id]: "PRESENT" }))
                                }
                                tone="emerald"
                                label="Present"
                                letter="P"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <StatusButton
                                active={status === "LATE"}
                                onClick={() =>
                                  setSelections((prev) => ({ ...prev, [student.id]: "LATE" }))
                                }
                                tone="amber"
                                label="Late"
                                letter="L"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <StatusButton
                                active={status === "ABSENT"}
                                onClick={() =>
                                  setSelections((prev) => ({ ...prev, [student.id]: "ABSENT" }))
                                }
                                tone="red"
                                label="Absent"
                                letter="A"
                              />
                            </td>
                            <td className="py-2 pl-3 pr-3.5 text-right">
                              <p className="truncate text-xs text-ink-400">
                                {record
                                  ? `${record.markedBy === "STUDENT" ? "Self-marked" : "By you"} \u00b7 ${formatMarkedAt(record.markedAt)}${
                                      record.adminUnlocked ? " \u00b7 unlocked for one edit" : ""
                                    }`
                                  : "Not marked yet"}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {isFutureDate && !saveError && (
                <p className="field-error mt-4 mb-0">Attendance can't be taken for a future date.</p>
              )}
              {saveError && <p className="alert-error mt-4 mb-0">{saveError}</p>}
              {saved && (
                <p className="alert-success mt-4 mb-0">
                  Attendance saved for {date}.
                  {lockedStudentIds.length > 0 &&
                    ` ${lockedStudentIds.length} record${lockedStudentIds.length === 1 ? "" : "s"} weren't saved because they're locked \u2014 request an unlock below.`}
                </p>
              )}

              {roster.students.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || isFutureDate}
                    className="btn-primary w-auto px-5"
                  >
                    {saving ? <Spinner className="h-4 w-4" /> : "Save attendance"}
                  </button>
                </div>
              )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
