"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { UsersIcon } from "@/components/icons";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// "Teachers should be able to monitor students with low attendance" (PRD
// section 22) has a lecture-progress counterpart here — this panel is the
// Day 4 slice of "Monitor Student Progress" (section 27), scoped to lecture
// completion since Tasks/Attendance land in later phases.
export default function StudentProgressPanel({ courseId }) {
  const [students, setStudents] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teacher/courses/${courseId}/progress`);
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error || "Could not load student progress.");
          return;
        }
        setStudents(data.students);
      } catch {
        setLoadError("Could not reach the server.");
      }
    })();
  }, [courseId]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <UsersIcon className="h-4 w-4 text-ink-400" />
        <h3 className="font-display text-base font-semibold text-ink-900">Student progress</h3>
      </div>

      {loadError && <p className="alert-error mt-3">{loadError}</p>}

      {!loadError && students === null && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-400">
          <Spinner className="h-4 w-4" /> Loading…
        </div>
      )}

      {students?.length === 0 && (
        <p className="mt-3 text-sm text-ink-400">No students enrolled in this course yet.</p>
      )}

      {students?.length > 0 && (
        <ul className="mt-4 space-y-3">
          {students.map((row) => (
            <li key={row.enrollmentId} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-xs font-semibold text-role-student">
                {initials(row.student.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink-800">{row.student.name}</p>
                  <p className="shrink-0 text-xs font-semibold text-ink-600">{row.progress}%</p>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-brass-500" style={{ width: `${row.progress}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-ink-400">
                  {row.completedLectures}/{row.totalLectures} lectures watched
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
