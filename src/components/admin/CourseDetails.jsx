"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import CourseThumbnail from "@/components/CourseThumbnail";
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import { formatDate, levelLabel, statusBadgeClass, statusLabel } from "@/lib/courseDisplay";

function listFromLines(text) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CourseDetails({ course, enrollmentCount }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  const objectives = listFromLines(course.objectives);
  const requirements = listFromLines(course.requirements);

  async function handleDelete() {
    if (!window.confirm(`Delete "${course.title}"? This can't be undone.`)) return;
    setDeleting(true);
    setNotice("");

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Couldn't delete this course.");
        setDeleting(false);
        return;
      }
      router.push("/admin/courses");
      router.refresh();
    } catch {
      setNotice("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to courses
      </Link>

      {notice && <p className="alert-error mt-5">{notice}</p>}

      <div className="card mt-5 overflow-hidden">
        <CourseThumbnail course={course} className="h-40 w-full" />

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${statusBadgeClass(course.status)}`}>{statusLabel(course.status)}</span>
            <span className="badge bg-ink-100 text-ink-600">{course.category?.name ?? "Uncategorized"}</span>
            <span className="badge bg-ink-100 text-ink-600">{levelLabel(course.level)}</span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-semibold text-ink-900">{course.title}</h1>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">{course.description}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-ink-100 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <GraduationCapIcon className="mt-0.5 h-4.5 w-4.5 text-ink-400" />
              <div>
                <p className="text-xs font-medium text-ink-400">Teacher</p>
                <p className="text-sm text-ink-800">
                  {course.teacher ? course.teacher.name : "Unassigned"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarCheckIcon className="mt-0.5 h-4.5 w-4.5 text-ink-400" />
              <div>
                <p className="text-xs font-medium text-ink-400">Duration</p>
                <p className="text-sm text-ink-800">{course.duration}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Start date</p>
              <p className="text-sm text-ink-800">{formatDate(course.startDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">End date</p>
              <p className="text-sm text-ink-800">{formatDate(course.endDate)}</p>
            </div>
            {typeof enrollmentCount === "number" && (
              <div>
                <p className="text-xs font-medium text-ink-400">Enrolled students</p>
                <p className="text-sm text-ink-800">{enrollmentCount}</p>
              </div>
            )}
          </div>

          {objectives.length > 0 && (
            <div className="mt-6 border-t border-ink-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Objectives</p>
              <ul className="mt-2 space-y-1.5">
                {objectives.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-500" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requirements.length > 0 && (
            <div className="mt-5 border-t border-ink-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Requirements</p>
              <ul className="mt-2 space-y-1.5">
                {requirements.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-5">
            <Link href={`/admin/courses/${course.id}/edit`} className="btn-secondary w-auto px-4">
              <PencilIcon className="h-4 w-4" />
              Edit course
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              {deleting ? <Spinner className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
