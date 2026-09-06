"use client";

// Real "Notifications" data for dashboard overview pages (PRD section 28),
// replacing the NOTIFICATIONS mock. Role-agnostic: reads /api/notifications
// for whoever is logged in, so the same component works on the Student
// overview and could be dropped onto Teacher/Admin overviews too.

import { useEffect, useState } from "react";
import ListPanel from "@/components/ListPanel";
import { BellIcon } from "@/components/icons";
import { formatRelativeTime, notificationIcon } from "@/lib/communicationDisplay";

export default function NotificationsPanel({ limit = 5, accentColor }) {
  const [notifications, setNotifications] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/notifications?limit=${limit}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong.");
        setNotifications(data.notifications);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, [limit]);

  function handleClick(item) {
    if (item.readAt) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => {});
  }

  return (
    <ListPanel
      title="Notifications"
      items={notifications ?? []}
      action={<BellIcon className="h-4 w-4 text-ink-300" />}
      accentColor={accentColor}
      renderItem={(item) => (
        <a
          href={item.link ?? "#"}
          onClick={() => handleClick(item)}
          className="-m-2 flex items-start gap-2.5 rounded-lg p-2 transition duration-150 hover:bg-brass-50/60"
        >
          <span className="mt-0.5 text-sm leading-none">{notificationIcon(item.type)}</span>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm ${item.readAt ? "text-ink-500" : "font-medium text-ink-800"}`}>
              {item.title}
            </p>
            <p className="text-xs text-ink-400">{formatRelativeTime(item.createdAt)}</p>
          </div>
          {!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass-500" />}
        </a>
      )}
      emptyLabel={
        loadError ? loadError : notifications === null ? "Loading…" : "You're all caught up."
      }
    />
  );
}
