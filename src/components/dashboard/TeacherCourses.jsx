"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import StatusBadge from "@/components/StatusBadge";
import { BookOpenIcon, UsersIcon, CalendarCheckIcon } from "@/components/icons";
import CourseThumbnail from "@/components/CourseThumbnail";
import { formatDate, levelLabel } from "@/lib/courseDisplay";

export default function TeacherCourses() {
  const [courses, setCourses] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/teacher/courses");
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error || "Could not load your courses.");
          return;
        }
        setCourses(data.courses);
      } catch {
        setLoadError("Could not reach the server.");
      }
    })();
  }, []);

  if (loadError) return <div className="alert-error mb-0">{loadError}</div>;

  if (courses === null) {
    return (
      <div className="card flex items-center justify-center gap-2 py-14 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading your courses…
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="card card-hover flex flex-col items-center gap-2 py-14 text-center">
        <BookOpenIcon className="h-8 w-8 text-ink-300" />
        <p className="text-sm font-medium text-ink-600">No courses assigned yet</p>
        <p className="max-w-xs text-xs text-ink-400">
          Once an Admin assigns you to a course, it will automatically show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/teacher/courses/${course.id}`}
          className="card block overflow-hidden transition hover:-translate-y-0.5 hover:border-brass-200 hover:shadow-gold"
        >
          <CourseThumbnail course={course} className="h-32 w-full" />
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={course.status} />
              <span className="badge bg-ink-100 text-ink-600">{course.category?.name ?? "Uncategorized"}</span>
              <span className="badge bg-ink-100 text-ink-600">{levelLabel(course.level)}</span>
            </div>
            <h3 className="mt-2.5 font-display text-base font-semibold text-ink-900">{course.title}</h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
              <span className="flex items-center gap-1.5">
                <UsersIcon className="h-3.5 w-3.5 text-ink-400" />
                {course._count?.enrollments ?? 0} student{course._count?.enrollments === 1 ? "" : "s"}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarCheckIcon className="h-3.5 w-3.5 text-ink-400" />
                {formatDate(course.startDate)} – {formatDate(course.endDate)}
              </span>
              {course.duration && <span>{course.duration}</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
