"use client";

// Header notification bell (Day 8, PRD section 28). Role-agnostic: reads
// from /api/notifications, which scopes everything to the current user
// regardless of role, so this one component covers Super Admin, Admin,
// Teacher and Student alike.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@/components/icons";
import { formatRelativeTime, notificationIcon } from "@/lib/communicationDisplay";

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const containerRef = useRef(null);

  async function load() {
    try {
      const data = await api("/api/notifications?limit=8");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  // Poll every 30s so the badge stays roughly current without the person
  // needing to refresh — light enough for a project this size, no
  // websockets/SSE infrastructure needed.
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) load();
  }

  async function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    try {
      await api("/api/notifications/read-all", { method: "PATCH" });
    } catch {
      // Best-effort — the next poll will reconcile if this silently failed.
    }
  }

  async function handleClickNotification(notification) {
    setOpen(false);
    if (!notification.readAt) {
      setUnreadCount((c) => Math.max(0, c - 1));
      api(`/api/notifications/${notification.id}/read`, { method: "PATCH" }).catch(() => {});
    }
    if (notification.link) router.push(notification.link);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="btn-ghost relative px-2.5"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-ink-100 bg-white p-1.5 shadow-panel">
            <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2.5">
              <p className="text-sm font-semibold text-ink-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="btn-chip px-2.5 py-1"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {loadError && <p className="px-3 py-4 text-xs text-red-600">{loadError}</p>}
              {!notifications && !loadError && (
                <p className="px-3 py-6 text-center text-xs text-ink-400">Loading…</p>
              )}
              {notifications && notifications.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-ink-400">
                  You're all caught up — nothing new yet.
                </p>
              )}
              {notifications?.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotification(n)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-ink-50 ${
                    !n.readAt ? "bg-brass-50/40" : ""
                  }`}
                >
                  <span className="mt-0.5 text-base leading-none">{notificationIcon(n.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-800">{n.title}</span>
                    {n.body && <span className="block truncate text-xs text-ink-400">{n.body}</span>}
                    <span className="mt-0.5 block text-[11px] text-ink-300">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </span>
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass-500" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
