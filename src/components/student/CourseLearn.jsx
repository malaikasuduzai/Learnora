"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  FileIcon,
  LinkIcon,
  LockIcon,
  PlayCircleIcon,
} from "@/components/icons";
import { flattenLectures, toEmbedUrl, isDirectVideoFile } from "@/lib/courseContent";

const STATUS_ICON = {
  completed: (props) => <CheckCircleIcon {...props} className="h-4 w-4 text-emerald-500" />,
  in_progress: (props) => <PlayCircleIcon {...props} className="h-4 w-4 text-brass-500" />,
  locked: (props) => <LockIcon {...props} className="h-4 w-4 text-ink-300" />,
};

function VideoPlayer({ videoUrl }) {
  if (!videoUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-ink-950 text-sm text-ink-400">
        No video attached to this lecture yet.
      </div>
    );
  }

  const embedUrl = toEmbedUrl(videoUrl);
  if (embedUrl) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-ink-950">
        <iframe
          src={embedUrl}
          title="Lecture video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideoFile(videoUrl)) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls src={videoUrl} className="aspect-video w-full rounded-xl bg-ink-950" />
    );
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-ink-950 text-sm text-ink-300">
      <p>This video can't be embedded here.</p>
      <a href={videoUrl} target="_blank" rel="noreferrer" className="text-brass-400 underline">
        Open the video in a new tab
      </a>
    </div>
  );
}

export default function CourseLearn({ courseId }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [marking, setMarking] = useState(false);
  const [actionError, setActionError] = useState("");

  async function load() {
    try {
      const res = await fetch(`/api/student/courses/${courseId}`);
      const json = await res.json();
      if (!res.ok) {
        setLoadError(json.error || "Could not load this course.");
        return;
      }
      setData(json);
      setSelectedId((prev) => {
        if (prev) return prev;
        const flat = flattenLectures(json.course.modules);
        const current = flat.find((l) => l.status === "in_progress") ?? flat[0];
        return current?.id ?? null;
      });
    } catch {
      setLoadError("Could not reach the server.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const flat = useMemo(() => (data ? flattenLectures(data.course.modules) : []), [data]);
  const selected = flat.find((l) => l.id === selectedId) ?? null;

  async function handleMarkComplete() {
    if (!selected) return;
    setMarking(true);
    setActionError("");
    try {
      const res = await fetch(`/api/student/lectures/${selected.id}/complete`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Could not mark this lecture complete.");
        return;
      }
      await load();
    } catch {
      setActionError("Could not reach the server.");
    } finally {
      setMarking(false);
    }
  }

  if (loadError) return <div className="alert-error">{loadError}</div>;

  if (!data) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading course…
      </div>
    );
  }

  const { course, progress, totalLectures, completedLectures } = data;

  return (
    <div className="space-y-5">
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to my courses
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">{course.title}</h1>
            <p className="mt-0.5 text-xs text-ink-400">
              {course.teacher ? `Teacher: ${course.teacher.name}` : "No teacher assigned"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-ink-400">Course progress</p>
            <p className="font-display text-2xl font-semibold text-ink-900">{progress}%</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brass-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-ink-400">
          {completedLectures} of {totalLectures} lecture{totalLectures === 1 ? "" : "s"} completed
        </p>
      </div>

      {totalLectures === 0 ? (
        <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm font-medium text-ink-600">No content yet</p>
          <p className="max-w-xs text-xs text-ink-400">
            Your teacher hasn't added any lectures to this course yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {course.modules.map((mod) => (
              <div key={mod.id} className="card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{mod.title}</p>
                <ul className="mt-2 space-y-1">
                  {mod.lectures.map((lecture) => {
                    const StatusIcon = STATUS_ICON[lecture.status] ?? STATUS_ICON.locked;
                    const isSelected = lecture.id === selectedId;
                    const isLocked = lecture.status === "locked";
                    return (
                      <li key={lecture.id}>
                        <button
                          type="button"
                          onClick={() => !isLocked && setSelectedId(lecture.id)}
                          disabled={isLocked}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                            isSelected ? "bg-role-studentSoft text-role-student" : "hover:bg-ink-50"
                          } ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <StatusIcon />
                          <span className="min-w-0 flex-1 truncate">{lecture.title}</span>
                          {lecture.duration && (
                            <span className="shrink-0 text-xs text-ink-400">{lecture.duration}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="space-y-4 lg:col-span-2">
            {selected ? (
              <div className="card p-5">
                <VideoPlayer videoUrl={selected.videoUrl} />

                <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-900">{selected.title}</h2>
                    <p className="mt-0.5 text-xs text-ink-400">{selected.moduleTitle}</p>
                  </div>
                  {selected.status === "completed" ? (
                    <span className="badge shrink-0 bg-emerald-50 text-emerald-700">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      disabled={marking}
                      className="btn-primary w-auto shrink-0 px-4"
                    >
                      {marking ? <Spinner className="h-4 w-4" /> : "Mark as completed"}
                    </button>
                  )}
                </div>

                {actionError && <p className="alert-error mt-3">{actionError}</p>}

                {selected.description && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-600">
                    {selected.description}
                  </p>
                )}

                {selected.notes && (
                  <div className="mt-5 border-t border-ink-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      Lecture notes
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-ink-600">{selected.notes}</p>
                  </div>
                )}

                {selected.resources.length > 0 && (
                  <div className="mt-5 border-t border-ink-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Resources</p>
                    <ul className="mt-2 space-y-1.5">
                      {selected.resources.map((resource) => (
                        <li key={resource.id}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-brand-700 hover:underline"
                          >
                            {resource.type === "LINK" ? (
                              <LinkIcon className="h-4 w-4 shrink-0" />
                            ) : (
                              <FileIcon className="h-4 w-4 shrink-0" />
                            )}
                            {resource.title}
                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex items-center justify-center py-16 text-sm text-ink-400">
                Select a lecture to get started.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
