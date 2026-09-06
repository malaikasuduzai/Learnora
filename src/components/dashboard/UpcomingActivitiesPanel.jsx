"use client";

// Real "Upcoming Activities" data for the student dashboard (PRD section
// 31), replacing the UPCOMING_ACTIVITIES mock now that lectures, tasks,
// attendance and announcements all exist. Client component so it can fetch
// after mount; StudentOverview itself stays a server component.

import { useEffect, useState } from "react";
import ListPanel from "@/components/ListPanel";

export default function UpcomingActivitiesPanel({ accentColor }) {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/upcoming");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong.");
        setItems(data.items);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  return (
    <ListPanel
      title="Upcoming Activities"
      items={items ?? []}
      accentColor={accentColor}
      renderItem={(item) => (
        <a href={item.link} className="flex items-start gap-2.5">
          <span className="text-base leading-none">{item.icon}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-700">{item.title}</p>
            <p className="text-xs text-ink-400">
              {item.detail} · {item.when}
            </p>
          </div>
        </a>
      )}
      emptyLabel={
        loadError
          ? loadError
          : items === null
            ? "Loading…"
            : "Nothing upcoming right now — check back after your next class."
      }
    />
  );
}
