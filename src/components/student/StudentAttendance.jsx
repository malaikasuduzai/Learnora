"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import {
  CalendarCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@/components/icons";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import {
  ATTENDANCE_STATUS_META,
  attendanceStatusLabel,
  formatDateLabel,
  formatMarkedAt,
  formatWindow,
} from "@/lib/attendanceDisplay";

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    throw err;
  }
  return data;
}

function HistoryPanel({ courseId }) {
  const [records, setRecords] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/api/student/courses/${courseId}/attendance/history`);
        setRecords(data.records);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, [courseId]);

  if (loadError) return <p className="alert-error mb-0">{loadError}</p>;

  if (!records) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading history…
      </div>
    );
  }

  if (records.length === 0) {
    return <p className="py-4 text-center text-xs text-ink-400">No attendance recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-ink-100 font-semibold uppercase tracking-wide text-ink-400">
            <th className="py-2 pr-3">Date</th>
            <th className="px-3 py-2">Status</th>
            <th className="py-2 pl-3 text-right">Marked at</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="py-2 pr-3 text-ink-700">{formatDateLabel(record.date)}</td>
              <td className="px-3 py-2">
                <span className={`badge ${ATTENDANCE_STATUS_META[record.status]?.badge ?? "bg-ink-100 text-ink-500"}`}>
                  {attendanceStatusLabel(record.status)}
                </span>
              </td>
              <td className="py-2 pl-3 text-right text-ink-400">{formatMarkedAt(record.markedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CourseAttendanceCard({ entry, onMark }) {
  const { course, todayRecord, withinWindow, percent, totalRecords } = entry;
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  // Self-marking requires the teacher's live session code, so there's a
  // code field alongside the button instead of a single click.
  const [code, setCode] = useState("");

  const isConfigured = Boolean(course.attendanceWindowStart && course.attendanceWindowEnd);

  async function handleMark() {
    if (!code.trim()) {
      setMarkError("Enter the code your teacher shared with the class.");
      return;
    }
    setMarking(true);
    setMarkError("");
    try {
      await onMark(course.id, code.trim());
      setCode("");
    } catch (err) {
      setMarkError(err.message);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="card border-l-4 border-l-role-student p-5 transition duration-200 hover:border-brass-200 hover:border-l-role-student hover:shadow-gold">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 font-display text-base font-semibold text-ink-900">
            <CalendarCheckIcon className="h-4 w-4 shrink-0 text-role-student" />
            {course.title}
          </h3>
          <p className="mt-0.5 text-xs text-ink-400">
            Window: {isConfigured ? formatWindow(course) : "Not configured yet"}
          </p>
        </div>
        {todayRecord ? (
          <span className={`badge shrink-0 ${ATTENDANCE_STATUS_META[todayRecord.status]?.badge ?? "bg-ink-100 text-ink-500"}`}>
            {attendanceStatusLabel(todayRecord.status)} today
          </span>
        ) : null}
      </div>

      {!todayRecord && !withinWindow && (
        <p className="mt-2 text-xs text-ink-400">
          {isConfigured ? "Attendance window closed for today." : "Your teacher hasn't set an attendance window for this course yet."}
        </p>
      )}

      {!todayRecord && withinWindow && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Attendance code"
            maxLength={20}
            className="field-input w-40 text-center uppercase tracking-[0.2em]"
          />
          <button
            type="button"
            onClick={handleMark}
            disabled={marking}
            className="btn-primary w-auto shrink-0 px-4 py-2 text-xs"
          >
            {marking ? <Spinner className="h-3.5 w-3.5" /> : "Mark present"}
          </button>
        </div>
      )}

      {markError && <p className="field-error mt-2">{markError}</p>}

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Attendance</span>
          <span className="font-semibold text-ink-700">{totalRecords ? `${percent}%` : "\u2014"}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brass-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-chip mt-3"
      >
        {open ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
        {open ? "Hide history" : "View history"}
      </button>

      {open && (
        <div className="mt-3 border-t border-ink-100 pt-3">
          <HistoryPanel courseId={course.id} />
        </div>
      )}
    </div>
  );
}

export default function StudentAttendance() {
  const [entries, setEntries] = useState(null);
  const [loadError, setLoadError] = useState("");

  async function load() {
    try {
      const { courses } = await api("/api/student/attendance");
      setEntries(courses);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMark(courseId, code) {
    await api(`/api/student/courses/${courseId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    await load();
  }

  if (loadError && !entries) return <div className="alert-error">{loadError}</div>;

  if (!entries) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading attendance…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StudentPageHeader
        icon={CalendarCheckIcon}
        title="Attendance"
        description="Your attendance record across every enrolled course."
      />

      {entries.length === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <CalendarCheckIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No courses yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Once you're enrolled in a course, you'll be able to mark attendance here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {entries.map((entry) => (
            <CourseAttendanceCard key={entry.course.id} entry={entry} onMark={handleMark} />
          ))}
        </div>
      )}
    </div>
  );
}
