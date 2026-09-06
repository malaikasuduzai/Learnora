"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { BellIcon } from "@/components/icons";
import { formatRelativeTime } from "@/lib/communicationDisplay";

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/announcements");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
        setAnnouncements(data.announcements);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  if (loadError) return <div className="alert-error">{loadError}</div>;

  if (!announcements) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading announcements…
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
        <BellIcon className="h-8 w-8 text-ink-300" />
        <p className="text-sm font-medium text-ink-600">No announcements yet</p>
        <p className="max-w-xs text-xs text-ink-400">
          Updates from your teachers will show up here as soon as they publish one.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="card card-hover flex gap-4 border-l-4 border-l-role-student p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-role-student">
            <BellIcon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-semibold text-ink-900">{a.title}</p>
              <span className="badge bg-ink-100 text-ink-500">{a.course.title}</span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-600">{a.body}</p>
            <p className="mt-2 text-xs text-ink-400">
              {a.teacher.name} · {formatRelativeTime(a.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
