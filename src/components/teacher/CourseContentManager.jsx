"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import CourseThumbnail from "@/components/CourseThumbnail";
import ModuleFormModal from "@/components/teacher/ModuleFormModal";
import LectureFormModal from "@/components/teacher/LectureFormModal";
import LectureResources from "@/components/teacher/LectureResources";
import StudentProgressPanel from "@/components/teacher/StudentProgressPanel";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  TrashIcon,
  VideoIcon,
} from "@/components/icons";

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.fieldErrors = data.fieldErrors;
    throw err;
  }
  return data;
}

function LectureRow({ lecture, moduleId, isFirst, isLast, onEdit, onDelete, onMove, onAddResource, onDeleteResource }) {
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rowError, setRowError] = useState("");

  async function handleMove(direction) {
    setMoving(true);
    setRowError("");
    try {
      await onMove(lecture.id, direction);
    } catch (err) {
      setRowError(err.message);
    } finally {
      setMoving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete lecture "${lecture.title}"? This can't be undone.`)) return;
    setDeleting(true);
    setRowError("");
    try {
      await onDelete(moduleId, lecture.id);
    } catch (err) {
      setRowError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-ink-100">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-ink-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-400" />
          )}
          {lecture.videoUrl ? (
            <PlayCircleIcon className="h-4 w-4 shrink-0 text-brass-500" />
          ) : (
            <VideoIcon className="h-4 w-4 shrink-0 text-ink-300" />
          )}
          <span className="truncate text-sm font-medium text-ink-800">{lecture.title}</span>
          {lecture.duration && (
            <span className="hidden shrink-0 text-xs text-ink-400 sm:inline">{lecture.duration}</span>
          )}
          {lecture.resources.length > 0 && (
            <span className="badge shrink-0 bg-ink-100 text-ink-500">
              {lecture.resources.length} resource{lecture.resources.length === 1 ? "" : "s"}
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleMove("up")}
            disabled={isFirst || moving}
            className="btn-ghost px-1.5 py-1 disabled:opacity-30"
            aria-label="Move lecture up"
          >
            <ChevronUpIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleMove("down")}
            disabled={isLast || moving}
            className="btn-ghost px-1.5 py-1 disabled:opacity-30"
            aria-label="Move lecture down"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(lecture)}
            className="btn-ghost px-1.5 py-1"
            aria-label="Edit lecture"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost px-1.5 py-1 text-red-500 hover:bg-red-50"
            aria-label="Delete lecture"
          >
            {deleting ? <Spinner className="h-3.5 w-3.5" /> : <TrashIcon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {rowError && <p className="field-error px-3 pb-2 pt-0">{rowError}</p>}

      {open && (
        <div className="space-y-3 border-t border-ink-100 px-3 py-3">
          {lecture.description && <p className="text-xs text-ink-600">{lecture.description}</p>}
          {lecture.videoUrl && (
            <p className="truncate text-xs text-ink-400">
              Video: <span className="text-ink-600">{lecture.videoUrl}</span>
            </p>
          )}
          {lecture.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Notes</p>
              <p className="mt-1 whitespace-pre-line text-xs text-ink-600">{lecture.notes}</p>
            </div>
          )}
          <LectureResources
            lectureId={lecture.id}
            resources={lecture.resources}
            onAdd={onAddResource}
            onDelete={onDeleteResource}
          />
        </div>
      )}
    </div>
  );
}

function ModuleCard({ mod, isFirst, isLast, onEditModule, onDeleteModule, onMoveModule, lectureHandlers }) {
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moduleError, setModuleError] = useState("");

  async function handleMove(direction) {
    setMoving(true);
    setModuleError("");
    try {
      await onMoveModule(mod.id, direction);
    } catch (err) {
      setModuleError(err.message);
    } finally {
      setMoving(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete module "${mod.title}"? This removes every lecture and resource inside it.`
      )
    )
      return;
    setDeleting(true);
    setModuleError("");
    try {
      await onDeleteModule(mod.id);
    } catch (err) {
      setModuleError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900">{mod.title}</h3>
          {mod.description && <p className="mt-1 max-w-lg text-xs text-ink-500">{mod.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => handleMove("up")}
            disabled={isFirst || moving}
            className="btn-ghost px-2 py-1.5 disabled:opacity-30"
            aria-label="Move module up"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleMove("down")}
            disabled={isLast || moving}
            className="btn-ghost px-2 py-1.5 disabled:opacity-30"
            aria-label="Move module down"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEditModule(mod)}
            className="btn-ghost px-2 py-1.5"
            aria-label="Edit module"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost px-2 py-1.5 text-red-500 hover:bg-red-50"
            aria-label="Delete module"
          >
            {deleting ? <Spinner className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {moduleError && <p className="alert-error mt-4 mb-0">{moduleError}</p>}

      <div className="mt-4 space-y-2">
        {mod.lectures.length === 0 && (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-4 text-center text-xs text-ink-400">
            No lectures yet.
          </p>
        )}
        {mod.lectures.map((lecture, i) => (
          <LectureRow
            key={lecture.id}
            lecture={lecture}
            moduleId={mod.id}
            isFirst={i === 0}
            isLast={i === mod.lectures.length - 1}
            onEdit={setEditingLecture}
            onDelete={lectureHandlers.onDelete}
            onMove={lectureHandlers.onMove}
            onAddResource={lectureHandlers.onAddResource}
            onDeleteResource={lectureHandlers.onDeleteResource}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowLectureForm(true)}
        className="btn-brass mt-4 w-auto px-3 text-xs"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add lecture
      </button>

      {showLectureForm && (
        <LectureFormModal
          onClose={() => setShowLectureForm(false)}
          onSubmit={async (values) => {
            await lectureHandlers.onCreate(mod.id, values);
            setShowLectureForm(false);
          }}
        />
      )}
      {editingLecture && (
        <LectureFormModal
          initial={editingLecture}
          onClose={() => setEditingLecture(null)}
          onSubmit={async (values) => {
            await lectureHandlers.onEditSubmit(editingLecture.id, values);
            setEditingLecture(null);
          }}
        />
      )}
    </div>
  );
}

export default function CourseContentManager({ courseId }) {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          api(`/api/teacher/courses/${courseId}`),
          api(`/api/teacher/courses/${courseId}/modules`),
        ]);
        setCourse(courseRes.course);
        setModules(modulesRes.modules);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, [courseId]);

  function patchModule(moduleId, updater) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? updater(m) : m)));
  }

  async function reload() {
    const modulesRes = await api(`/api/teacher/courses/${courseId}/modules`);
    setModules(modulesRes.modules);
  }

  const moduleHandlers = {
    async create(values) {
      const { module: created } = await api(`/api/teacher/courses/${courseId}/modules`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      setModules((prev) => [...prev, created]);
    },
    async editSubmit(moduleId, values) {
      const { module: updated } = await api(`/api/teacher/modules/${moduleId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      patchModule(moduleId, (m) => ({ ...m, title: updated.title, description: updated.description }));
    },
    async delete(moduleId) {
      await api(`/api/teacher/modules/${moduleId}`, { method: "DELETE" });
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    },
    async move(moduleId, direction) {
      await api(`/api/teacher/modules/${moduleId}/move`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      });
      await reload();
    },
  };

  const lectureHandlers = {
    async onCreate(moduleId, values) {
      const { lecture } = await api(`/api/teacher/modules/${moduleId}/lectures`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      patchModule(moduleId, (m) => ({ ...m, lectures: [...m.lectures, lecture] }));
    },
    async onEditSubmit(lectureId, values) {
      const { lecture: updated } = await api(`/api/teacher/lectures/${lectureId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lectures: m.lectures.map((l) => (l.id === lectureId ? updated : l)),
        }))
      );
    },
    async onDelete(moduleId, lectureId) {
      await api(`/api/teacher/lectures/${lectureId}`, { method: "DELETE" });
      patchModule(moduleId, (m) => ({ ...m, lectures: m.lectures.filter((l) => l.id !== lectureId) }));
    },
    async onMove(lectureId, direction) {
      await api(`/api/teacher/lectures/${lectureId}/move`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      });
      await reload();
    },
    async onAddResource(lectureId, values) {
      const { resource } = await api(`/api/teacher/lectures/${lectureId}/resources`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lectures: m.lectures.map((l) =>
            l.id === lectureId ? { ...l, resources: [...l.resources, resource] } : l
          ),
        }))
      );
    },
    async onDeleteResource(lectureId, resourceId) {
      await api(`/api/teacher/resources/${resourceId}`, { method: "DELETE" });
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lectures: m.lectures.map((l) =>
            l.id === lectureId
              ? { ...l, resources: l.resources.filter((r) => r.id !== resourceId) }
              : l
          ),
        }))
      );
    },
  };

  if (loadError) return <div className="alert-error">{loadError}</div>;

  if (!course || !modules) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading course content…
      </div>
    );
  }

  const totalLectures = modules.reduce((sum, m) => sum + m.lectures.length, 0);

  return (
    <div className="space-y-5">
      <Link
        href="/teacher/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to my courses
      </Link>

      <div className="card relative flex flex-wrap items-center gap-4 overflow-hidden border-role-teacherSoft bg-gradient-to-br from-role-teacherSoft via-white to-white p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-role-teacher/10 blur-2xl" />
        <CourseThumbnail
          course={course}
          className="relative hidden h-14 w-20 shrink-0 rounded-lg shadow-sm sm:block"
        />
        <div className="relative min-w-0 flex-1">
          <h1 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">{course.title}</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            {modules.length} module{modules.length === 1 ? "" : "s"} · {totalLectures} lecture
            {totalLectures === 1 ? "" : "s"} · {course._count?.enrollments ?? 0} student
            {course._count?.enrollments === 1 ? "" : "s"}
          </p>
        </div>
        <button type="button" onClick={() => setShowModuleForm(true)} className="btn-brass w-auto px-4">
          <PlusIcon className="h-4 w-4" />
          Add module
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {modules.length === 0 ? (
            <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
              <ClockIcon className="h-8 w-8 text-ink-300" />
              <p className="text-sm font-medium text-ink-600">No modules yet</p>
              <p className="max-w-xs text-xs text-ink-400">
                Start by adding your first module, then add lectures inside it.
              </p>
            </div>
          ) : (
            modules.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                mod={mod}
                isFirst={i === 0}
                isLast={i === modules.length - 1}
                onEditModule={setEditingModule}
                onDeleteModule={moduleHandlers.delete}
                onMoveModule={moduleHandlers.move}
                lectureHandlers={lectureHandlers}
              />
            ))
          )}
        </div>
        <div className="lg:col-span-1">
          <StudentProgressPanel courseId={courseId} />
        </div>
      </div>

      {showModuleForm && (
        <ModuleFormModal
          onClose={() => setShowModuleForm(false)}
          onSubmit={async (values) => {
            await moduleHandlers.create(values);
            setShowModuleForm(false);
          }}
        />
      )}
      {editingModule && (
        <ModuleFormModal
          initial={editingModule}
          onClose={() => setEditingModule(null)}
          onSubmit={async (values) => {
            await moduleHandlers.editSubmit(editingModule.id, values);
            setEditingModule(null);
          }}
        />
      )}
    </div>
  );
}
