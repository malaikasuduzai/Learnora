"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import StudentCourseCard from "@/components/student/StudentCourseCard";
import { BookOpenIcon } from "@/components/icons";
import Link from "next/link";

export default function StudentCourses({ limit }) {
  const [courses, setCourses] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/courses");
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
        <p className="text-sm font-medium text-ink-600">No courses yet</p>
        <p className="max-w-xs text-xs text-ink-400">
          Browse the course catalog and enroll yourself, or wait for an Admin to enroll you.
        </p>
        <Link href="/student/courses/browse" className="btn-primary mt-2 w-auto px-5">
          Browse courses
        </Link>
      </div>
    );
  }

  const visible = limit ? courses.slice(0, limit) : courses;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {visible.map((course) => (
        <StudentCourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
