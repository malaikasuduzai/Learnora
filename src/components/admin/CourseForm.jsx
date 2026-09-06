"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";
import { ArrowLeftIcon } from "@/components/icons";
import { COURSE_LEVELS, COURSE_STATUSES, toDateInputValue } from "@/lib/courseDisplay";

function toFormState(course) {
  return {
    title: course?.title ?? "",
    description: course?.description ?? "",
    thumbnail: course?.thumbnail ?? "",
    categoryId: course?.categoryId ?? "",
    duration: course?.duration ?? "",
    level: course?.level ?? "BEGINNER",
    objectives: course?.objectives ?? "",
    requirements: course?.requirements ?? "",
    status: course?.status ?? "DRAFT",
    teacherId: course?.teacherId ?? "",
    startDate: toDateInputValue(course?.startDate),
    endDate: toDateInputValue(course?.endDate),
  };
}

export default function CourseForm({ course, categories, teachers }) {
  const router = useRouter();
  const isEdit = Boolean(course);
  const [form, setForm] = useState(() => toFormState(course));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setNotice("");

    try {
      const url = isEdit ? `/api/admin/courses/${course.id}` : "/api/admin/courses";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setNotice(data.error && !data.fieldErrors ? data.error : "");
        return;
      }

      const courseId = data.course?.id ?? course?.id;
      router.push(`/admin/courses/${courseId}`);
      router.refresh();
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={isEdit ? `/admin/courses/${course.id}` : "/admin/courses"}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {isEdit ? "Back to course" : "Back to courses"}
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
        {isEdit ? "Edit course" : "Create a new course"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        {isEdit
          ? "Update the course details below."
          : "Fill in the course details. You can always edit these later."}
      </p>

      {notice && <p className="alert-error mt-5">{notice}</p>}

      <form onSubmit={handleSubmit} className="card mt-6 space-y-6 p-6">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Basics</p>
          <FormField
            label="Course name"
            name="title"
            value={form.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="e.g. Full Stack Web Development"
          />

          <div>
            <label htmlFor="description" className="field-label">
              Course description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="What will students learn in this course?"
              className={`field-textarea ${errors.description ? "field-input-error" : ""}`}
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <FormField
            label="Course thumbnail URL"
            name="thumbnail"
            value={form.thumbnail}
            onChange={handleChange}
            error={errors.thumbnail}
            placeholder="https://… (optional)"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categoryId" className="field-label">
                Course category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className={`field-input ${errors.categoryId ? "field-input-error" : ""}`}
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="field-error">{errors.categoryId}</p>}
              {categories.length === 0 && (
                <p className="mt-1.5 text-xs text-ink-400">
                  No categories yet — add one from the Courses page first.
                </p>
              )}
            </div>

            <FormField
              label="Duration"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              error={errors.duration}
              placeholder="e.g. 6 Weeks"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="level" className="field-label">
                Course level
              </label>
              <select
                id="level"
                name="level"
                value={form.level}
                onChange={handleChange}
                className="field-input"
              >
                {COURSE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="field-label">
                Course status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="field-input"
              >
                {COURSE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-ink-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Curriculum details</p>

          <div>
            <label htmlFor="objectives" className="field-label">
              Course objectives <span className="font-normal text-ink-400">(optional, one per line)</span>
            </label>
            <textarea
              id="objectives"
              name="objectives"
              rows={3}
              value={form.objectives}
              onChange={handleChange}
              placeholder={"Build responsive web apps\nWork with REST APIs"}
              className={`field-textarea ${errors.objectives ? "field-input-error" : ""}`}
            />
            {errors.objectives && <p className="field-error">{errors.objectives}</p>}
          </div>

          <div>
            <label htmlFor="requirements" className="field-label">
              Course requirements <span className="font-normal text-ink-400">(optional, one per line)</span>
            </label>
            <textarea
              id="requirements"
              name="requirements"
              rows={3}
              value={form.requirements}
              onChange={handleChange}
              placeholder={"Basic HTML & CSS\nA laptop with 8GB+ RAM"}
              className={`field-textarea ${errors.requirements ? "field-input-error" : ""}`}
            />
            {errors.requirements && <p className="field-error">{errors.requirements}</p>}
          </div>
        </div>

        <div className="space-y-4 border-t border-ink-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Schedule & teacher</p>

          <div>
            <label htmlFor="teacherId" className="field-label">
              Assigned teacher <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <select
              id="teacherId"
              name="teacherId"
              value={form.teacherId}
              onChange={handleChange}
              className={`field-input ${errors.teacherId ? "field-input-error" : ""}`}
            >
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            {errors.teacherId && <p className="field-error">{errors.teacherId}</p>}
            {teachers.length === 0 && (
              <p className="mt-1.5 text-xs text-ink-400">
                No teacher accounts yet — they can register from the sign-up page and you can assign
                them here afterwards.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Course start date"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              error={errors.startDate}
            />
            <FormField
              label="Course end date"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              error={errors.endDate}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-ink-100 pt-5">
          <button type="submit" disabled={submitting} className="btn-primary w-auto px-8">
            {submitting ? <Spinner className="h-4 w-4" /> : isEdit ? "Save changes" : "Create course"}
          </button>
          <Link href={isEdit ? `/admin/courses/${course.id}` : "/admin/courses"} className="btn-secondary w-auto px-6">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
