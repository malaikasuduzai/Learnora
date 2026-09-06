"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { UsersIcon } from "@/components/icons";
import { toDateTimeInputValue } from "@/lib/taskDisplay";

const TITLE_MAX_LENGTH = 150;

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function TaskFormModal({ courses, initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial);
  const [courseId, setCourseId] = useState(initial?.courseId ?? courses[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [startDate, setStartDate] = useState(toDateTimeInputValue(initial?.startDate));
  const [deadline, setDeadline] = useState(toDateTimeInputValue(initial?.deadline));
  const [maxMarks, setMaxMarks] = useState(initial?.maxMarks ?? 100);
  const [attachmentUrl, setAttachmentUrl] = useState(initial?.attachmentUrl ?? "");
  const [status, setStatus] = useState(initial?.status ?? "PUBLISHED");
  const [selectedIds, setSelectedIds] = useState(new Set(initial?.assignedStudentIds ?? []));

  const [students, setStudents] = useState(null);
  const [studentsError, setStudentsError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!courseId) {
      setStudents([]);
      return;
    }
    setStudents(null);
    (async () => {
      try {
        const res = await fetch(`/api/teacher/courses/${courseId}/students`);
        const data = await res.json();
        if (!res.ok) {
          setStudentsError(data.error || "Could not load enrolled students.");
          setStudents([]);
          return;
        }
        setStudents(data.students);
      } catch {
        setStudentsError("Could not reach the server.");
        setStudents([]);
      }
    })();
  }, [courseId]);

  function toggleStudent(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set((students ?? []).map((s) => s.id)));
  }

  function selectNone() {
    setSelectedIds(new Set());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setNotice("");
    try {
      await onSubmit({
        courseId,
        title,
        description,
        instructions,
        startDate,
        deadline,
        maxMarks,
        attachmentUrl,
        status,
        assignedStudentIds: [...selectedIds],
      });
    } catch (err) {
      setErrors(err?.fieldErrors ?? {});
      setNotice(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit task" : "Create a task"}
      description="Set the deadline, marking scale, and which enrolled students this applies to."
      onClose={onClose}
      wide
    >
      {notice && <div className="alert-error">{notice}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-course" className="field-label">
            Course
          </label>
          <select
            id="task-course"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setSelectedIds(new Set());
            }}
            disabled={isEdit}
            className={`field-input ${errors.courseId ? "field-input-error" : ""} ${
              isEdit ? "cursor-not-allowed bg-ink-50 text-ink-500" : ""
            }`}
          >
            {courses.length === 0 && <option value="">No assigned courses</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {errors.courseId && <p className="field-error">{errors.courseId}</p>}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="task-title" className="field-label">
              Task title
            </label>
            <span
              className={`mb-1.5 shrink-0 text-xs tabular-nums ${
                title.length >= TITLE_MAX_LENGTH ? "font-medium text-red-500" : "text-ink-400"
              }`}
            >
              {title.length} / {TITLE_MAX_LENGTH}
            </span>
          </div>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Portfolio Assignment"
            maxLength={TITLE_MAX_LENGTH}
            className={`field-input ${errors.title ? "field-input-error" : ""}`}
            autoFocus
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="task-description" className="field-label">
            Description
          </label>
          <textarea
            id="task-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this task about?"
            className={`field-textarea ${errors.description ? "field-input-error" : ""}`}
          />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="task-instructions" className="field-label">
            Instructions <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="task-instructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step instructions for completing the task"
            className={`field-textarea ${errors.instructions ? "field-input-error" : ""}`}
          />
          {errors.instructions && <p className="field-error">{errors.instructions}</p>}
        </div>

        <div>
          <label htmlFor="task-attachment" className="field-label">
            Attachment / reference material URL{" "}
            <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="task-attachment"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="https://…"
            className={`field-input ${errors.attachmentUrl ? "field-input-error" : ""}`}
          />
          {errors.attachmentUrl && <p className="field-error">{errors.attachmentUrl}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="task-start" className="field-label">
              Start date <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input
              id="task-start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`field-input ${errors.startDate ? "field-input-error" : ""}`}
            />
            {errors.startDate && <p className="field-error">{errors.startDate}</p>}
          </div>
          <div>
            <label htmlFor="task-deadline" className="field-label">
              Submission deadline
            </label>
            <input
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={`field-input ${errors.deadline ? "field-input-error" : ""}`}
            />
            {errors.deadline && <p className="field-error">{errors.deadline}</p>}
          </div>
          <div>
            <label htmlFor="task-marks" className="field-label">
              Maximum marks
            </label>
            <input
              id="task-marks"
              type="number"
              min={1}
              max={1000}
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className={`field-input ${errors.maxMarks ? "field-input-error" : ""}`}
            />
            {errors.maxMarks && <p className="field-error">{errors.maxMarks}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="task-status" className="field-label">
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="field-input"
          >
            <option value="PUBLISHED">Published — visible to assigned students</option>
            <option value="DRAFT">Draft — hidden until published</option>
          </select>
        </div>

        <div className="border-t border-ink-100 pt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <label className="field-label mb-0">Assigned students</label>
            {students && students.length > 0 && (
              <div className="flex items-center gap-3 text-xs font-medium text-ink-500">
                <button type="button" onClick={selectAll} className="hover:text-ink-900">
                  Select all
                </button>
                <button type="button" onClick={selectNone} className="hover:text-ink-900">
                  Clear
                </button>
              </div>
            )}
          </div>
          {errors.assignedStudentIds && <p className="field-error mb-2 mt-0">{errors.assignedStudentIds}</p>}

          {studentsError ? (
            <p className="alert-error mb-0">{studentsError}</p>
          ) : students === null ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-400">
              <Spinner className="h-4 w-4" /> Loading enrolled students…
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-ink-200 py-8 text-center">
              <UsersIcon className="h-6 w-6 text-ink-300" />
              <p className="text-xs text-ink-400">
                No students are enrolled in this course yet, so there's no one to assign.
              </p>
            </div>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto overscroll-contain rounded-lg border border-ink-100 p-1.5">
              {students.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-ink-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-400"
                  />
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-[11px] font-semibold text-role-student">
                    {initials(student.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-800">
                      {student.name}
                    </span>
                    <span className="block truncate text-xs text-ink-400">{student.email}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-400">{selectedIds.size} student(s) selected</p>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-ink-100 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary w-auto px-6">
            {submitting ? <Spinner className="h-4 w-4" /> : isEdit ? "Save changes" : "Create task"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary w-auto px-5">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
