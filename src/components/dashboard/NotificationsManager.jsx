"use client";

// Full notification center for the account settings page. Nothing here is
// ever deleted server-side (there's no DELETE route), so every notification
// a person has ever received stays visible in this list as a running
// history/backup — this component just gives read/unread controls on top
// of that.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { BellIcon, CheckCircleIcon } from "@/components/icons";
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

export default function NotificationsManager() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  async function load() {
    try {
      const data = await api("/api/notifications?limit=50");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((prev) =>
      prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    try {
      await api("/api/notifications/read-all", { method: "PATCH" });
    } catch {
      // Best-effort — a later load() will reconcile if this silently failed.
    }
  }

  async function handleMarkRead(n) {
    if (n.readAt) return;
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api(`/api/notifications/${n.id}/read`, { method: "PATCH" });
    } catch {
      // Best-effort — same as above.
    }
  }

  function handleClick(n) {
    handleMarkRead(n);
    if (n.link) router.push(n.link);
  }

  const visible = (notifications ?? []).filter((n) => (filter === "unread" ? !n.readAt : true));

  return (
    <div className="card p-6 transition duration-200 hover:border-brass-200 hover:shadow-gold lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brass-50 text-brass-600">
            <BellIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink-900">Notifications</p>
            <p className="text-xs text-ink-400">
              Your full history stays here — nothing gets removed, just marked as read.
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="btn-secondary w-auto px-3 py-1.5 text-xs"
          >
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            filter === "all" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
          }`}
        >
          All{notifications ? ` (${notifications.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            filter === "unread" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"
          }`}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </button>
      </div>

      <div className="mt-4 max-h-[420px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
        {loadError && <p className="alert-error mb-0">{loadError}</p>}

        {!notifications && !loadError && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-400">
            <Spinner className="h-4 w-4" /> Loading notifications…
          </div>
        )}

        {notifications && visible.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-400">
            {filter === "unread" ? "No unread notifications — all caught up." : "No notifications yet."}
          </p>
        )}

        {visible.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleClick(n)}
            className={`flex w-full items-start gap-3 rounded-xl px-3.5 py-3 text-left transition duration-150 hover:bg-ink-50 hover:shadow-card ${
              !n.readAt ? "bg-brass-50/40" : ""
            }`}
          >
            <span className="mt-0.5 text-base leading-none">{notificationIcon(n.type)}</span>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-sm ${
                  n.readAt ? "text-ink-600" : "font-semibold text-ink-900"
                }`}
              >
                {n.title}
              </span>
              {n.body && <span className="block truncate text-xs text-ink-400">{n.body}</span>}
              <span className="mt-0.5 block text-[11px] text-ink-300">
                {formatRelativeTime(n.createdAt)}
              </span>
            </span>
            {!n.readAt ? (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass-500" />
            ) : (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
