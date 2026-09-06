"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import CourseThumbnail from "@/components/CourseThumbnail";
import { BookOpenIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { COURSE_STATUSES, formatDate, levelLabel, statusBadgeClass, statusLabel } from "@/lib/courseDisplay";

export default function CoursesTable({ initialCourses, categories }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (categoryId) params.set("categoryId", categoryId);
      if (status) params.set("status", status);

      try {
        const res = await fetch(`/api/admin/courses?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok) setCourses(data.courses ?? []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setNotice("Couldn't load courses. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, categoryId, status]);

  async function handleDelete(course) {
    if (!window.confirm(`Delete "${course.title}"? This can't be undone.`)) return;
    setDeletingId(course.id);
    setNotice("");

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Couldn't delete this course.");
        return;
      }
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      router.refresh();
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="field-input pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="field-input w-auto"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input w-auto">
          <option value="">All statuses</option>
          {COURSE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {notice && <p className="mt-3 text-xs font-medium text-red-600">{notice}</p>}

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-ink-400">
            <Spinner className="h-5 w-5" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 py-12 text-center">
            <BookOpenIcon className="h-6 w-6 text-ink-300" />
            <p className="text-sm text-ink-500">No courses match yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex items-center gap-4 rounded-lg border-l-4 border-l-role-admin px-2 py-3.5 transition-colors hover:bg-role-adminSoft/50"
              >
                <CourseThumbnail
                  course={course}
                  className="hidden h-12 w-16 shrink-0 rounded-lg sm:block"
                />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900 hover:underline"
                  >
                    <BookOpenIcon className="h-3.5 w-3.5 shrink-0 text-role-admin" />
                    {course.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-ink-400">
                    {course.category?.name ?? "Uncategorized"} · {levelLabel(course.level)} ·{" "}
                    {course.duration}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {course.teacher ? `Teacher: ${course.teacher.name}` : "No teacher assigned"}
                  </p>
                </div>

                <span className={`badge shrink-0 ${statusBadgeClass(course.status)}`}>
                  {statusLabel(course.status)}
                </span>

                <span className="hidden shrink-0 text-xs text-ink-400 md:block">
                  {formatDate(course.startDate)}
                </span>

                <button
                  type="button"
                  onClick={() => handleDelete(course)}
                  disabled={deletingId === course.id}
                  className="btn-chip-danger shrink-0"
                >
                  {deletingId === course.id ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <>
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
