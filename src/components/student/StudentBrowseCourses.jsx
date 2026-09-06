"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import { BookOpenIcon, SearchIcon, CheckCircleIcon, UsersIcon } from "@/components/icons";
import CourseThumbnail from "@/components/CourseThumbnail";
import { levelLabel, formatDate } from "@/lib/courseDisplay";

// "Browse Course -> View Course Details -> Enroll -> Enrollment
// Confirmation -> Course Appears in My Courses" (PRD section 10). Also
// covers course search/filter by name and category (PRD section 32).
export default function StudentBrowseCourses() {
  const [courses, setCourses] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // course being viewed in the details modal
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [confirmed, setConfirmed] = useState(null); // course just successfully enrolled in

  async function loadCourses(searchValue) {
    try {
      const params = new URLSearchParams();
      if (searchValue) params.set("search", searchValue);
      const res = await fetch(`/api/student/courses/available?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Could not load available courses.");
        return;
      }
      setCourses(data.courses);
      setLoadError("");
    } catch {
      setLoadError("Could not reach the server.");
    }
  }

  useEffect(() => {
    loadCourses("");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadCourses(search), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleEnroll(course) {
    setEnrolling(true);
    setEnrollError("");
    try {
      const res = await fetch(`/api/student/courses/${course.id}/enroll`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setEnrollError(data.error || "Could not enroll in this course.");
        return;
      }
      setSelected(null);
      setConfirmed(course);
      setCourses((prev) => (prev ? prev.filter((c) => c.id !== course.id) : prev));
    } catch {
      setEnrollError("Could not reach the server.");
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses by name…"
          className="field-input pl-9"
        />
      </div>

      {loadError && <div className="alert-error">{loadError}</div>}

      {courses === null && !loadError && (
        <div className="card flex items-center justify-center gap-2 py-14 text-sm text-ink-400">
          <Spinner className="h-4 w-4" /> Loading available courses…
        </div>
      )}

      {courses !== null && courses.length === 0 && (
        <div className="card card-hover flex flex-col items-center gap-2 py-14 text-center">
          <BookOpenIcon className="h-8 w-8 text-ink-300" />
          <p className="text-sm font-medium text-ink-600">No courses to enroll in right now</p>
          <p className="max-w-xs text-xs text-ink-400">
            {search
              ? "No published courses match that search."
              : "You're already enrolled in every published course, or none are open yet."}
          </p>
        </div>
      )}

      {courses !== null && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => {
                setSelected(course);
                setEnrollError("");
              }}
              className="card block overflow-hidden text-left transition hover:border-brass-200 hover:shadow-gold"
            >
              <CourseThumbnail course={course} className="h-32 w-full" />
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="badge bg-ink-100 text-ink-600">{levelLabel(course.level)}</span>
                  {course.category && (
                    <span className="badge bg-brass-50 text-brass-700">{course.category.name}</span>
                  )}
                </div>
                <h3 className="mt-2.5 font-display text-base font-semibold text-ink-900">
                  {course.title}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-ink-400">{course.description}</p>
                <p className="mt-2 text-xs text-ink-500">
                  {course.teacher ? `Teacher: ${course.teacher.name}` : "No teacher assigned"}
                  {course.duration ? ` \u00b7 ${course.duration}` : ""}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="h-3.5 w-3.5" /> {course.enrolledCount} enrolled
                  </span>
                  <span className="font-semibold text-brass-600">View details →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal
          title={selected.title}
          description={`${levelLabel(selected.level)}${selected.duration ? ` \u00b7 ${selected.duration}` : ""}`}
          onClose={() => {
            setSelected(null);
            setEnrollError("");
          }}
          wide
        >
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 text-sm">
            <CourseThumbnail course={selected} className="h-40 w-full rounded-xl" />
            <p className="text-ink-600">{selected.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-ink-400">Teacher</p>
                <p className="mt-0.5 font-medium text-ink-700">
                  {selected.teacher?.name ?? "Not yet assigned"}
                </p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-ink-400">Category</p>
                <p className="mt-0.5 font-medium text-ink-700">{selected.category?.name ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-ink-400">Lectures</p>
                <p className="mt-0.5 font-medium text-ink-700">{selected.lectureCount}</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-ink-400">Duration</p>
                <p className="mt-0.5 font-medium text-ink-700">{selected.duration || "—"}</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-ink-400">Starts</p>
                <p className="mt-0.5 font-medium text-ink-700">{formatDate(selected.startDate)}</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-ink-400">Ends</p>
                <p className="mt-0.5 font-medium text-ink-700">{formatDate(selected.endDate)}</p>
              </div>
            </div>

            {selected.objectives && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Objectives
                </p>
                <p className="mt-1 whitespace-pre-line text-ink-600">{selected.objectives}</p>
              </div>
            )}
            {selected.requirements && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Requirements
                </p>
                <p className="mt-1 whitespace-pre-line text-ink-600">{selected.requirements}</p>
              </div>
            )}
          </div>

          {enrollError && <div className="alert-error mt-4">{enrollError}</div>}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary w-auto px-5"
              disabled={enrolling}
              onClick={() => handleEnroll(selected)}
            >
              {enrolling ? <Spinner className="h-4 w-4" /> : "Enroll in this course"}
            </button>
          </div>
        </Modal>
      )}

      {confirmed && (
        <Modal title="Enrollment confirmed" onClose={() => setConfirmed(null)}>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-ink-600">
              You're enrolled in <span className="font-semibold text-ink-900">{confirmed.title}</span>.
              It now appears under <span className="font-semibold">My courses</span>.
            </p>
            <div className="mt-2 flex gap-2">
              <a href="/student/courses" className="btn-primary w-auto px-5">
                Go to My courses
              </a>
              <button type="button" className="btn-ghost" onClick={() => setConfirmed(null)}>
                Keep browsing
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
