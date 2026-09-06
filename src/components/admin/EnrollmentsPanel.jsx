"use client";

import { useEffect, useState, useCallback } from "react";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { UsersIcon, SearchIcon, PlusIcon } from "@/components/icons";
import { formatDate } from "@/lib/courseDisplay";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function EnrollStudentModal({ courseId, onClose, onEnrolled }) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    async (term) => {
      try {
        const params = new URLSearchParams({ excludeCourseId: courseId });
        if (term) params.set("search", term);
        const res = await fetch(`/api/admin/students?${params.toString()}`);
        const data = await res.json();
        if (res.ok) setStudents(data.students);
      } catch {
        setStudents([]);
      }
    },
    [courseId]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(search), 250);
    return () => clearTimeout(timer);
  }, [search, load]);

  async function handleEnroll(student) {
    setError("");
    setEnrollingId(student.id);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not enroll this student.");
        return;
      }
      onEnrolled(data.enrollment);
      setStudents((prev) => (prev || []).filter((s) => s.id !== student.id));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <Modal
      title="Enroll a student"
      description="Search for a registered student to add them to this course."
      onClose={onClose}
    >
      {error && <div className="alert-error">{error}</div>}
      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or email…"
          className="field-input pl-9"
          autoFocus
        />
      </div>

      <div className="max-h-72 space-y-1.5 overflow-y-auto">
        {students === null ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-400">
            <Spinner className="h-4 w-4" /> Loading students…
          </div>
        ) : students.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">No students found.</p>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-xs font-semibold text-role-student">
                  {initials(student.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{student.name}</p>
                  <p className="truncate text-xs text-ink-400">{student.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleEnroll(student)}
                disabled={enrollingId === student.id}
                className="btn-secondary w-auto shrink-0 px-3 py-1.5 text-xs"
              >
                {enrollingId === student.id ? "Enrolling…" : "Enroll"}
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

export default function EnrollmentsPanel({ courseId, initialEnrollments }) {
  const [enrollments, setEnrollments] = useState(initialEnrollments || []);
  const [showEnroll, setShowEnroll] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  function handleEnrolled(enrollment) {
    setShowEnroll(false);
    setEnrollments((prev) => [enrollment, ...prev]);
  }

  async function handleUnenroll(enrollmentId) {
    setRemovingId(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: "DELETE" });
      if (res.ok) {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink-900">Enrolled students</h3>
          <p className="mt-0.5 text-xs text-ink-400">
            {enrollments.length} student{enrollments.length === 1 ? "" : "s"} enrolled
          </p>
        </div>
        <button type="button" onClick={() => setShowEnroll(true)} className="btn-brass w-auto px-4">
          <PlusIcon className="h-4 w-4" />
          Enroll student
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <UsersIcon className="h-7 w-7 text-ink-300" />
          <p className="text-sm text-ink-400">No students enrolled yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {enrollments.map((enrollment) => (
            <li key={enrollment.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-xs font-semibold text-role-student">
                  {initials(enrollment.student.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{enrollment.student.name}</p>
                  <p className="truncate text-xs text-ink-400">{enrollment.student.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={enrollment.status} />
                <span className="hidden text-xs text-ink-400 sm:inline">
                  Enrolled {formatDate(enrollment.enrolledAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleUnenroll(enrollment.id)}
                  disabled={removingId === enrollment.id}
                  className="btn-ghost px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  {removingId === enrollment.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showEnroll && (
        <EnrollStudentModal courseId={courseId} onClose={() => setShowEnroll(false)} onEnrolled={handleEnrolled} />
      )}
    </div>
  );
}
