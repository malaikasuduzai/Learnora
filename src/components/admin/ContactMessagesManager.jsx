"use client";

import { useEffect, useState, useCallback } from "react";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import { SearchIcon, MailIcon, TrashIcon } from "@/components/icons";

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function mailtoHref(message) {
  const subject = encodeURIComponent(
    message.subject.toLowerCase().startsWith("re:") ? message.subject : `Re: ${message.subject}`
  );
  return `mailto:${message.email}?subject=${subject}`;
}

// Full message view + actions. Opening it marks the message read (the
// usual inbox behaviour), on top of the explicit mark read/unread toggle
// available from the list itself.
function MessageDetailModal({ message, onClose, onToggleRead, onDelete, deleting }) {
  return (
    <Modal
      title={message.subject}
      description={`From ${message.name} · ${message.email} · ${formatDate(message.createdAt)}`}
      onClose={onClose}
      wide
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{message.body}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onDelete(message)}
          disabled={deleting}
          className="btn-ghost w-auto px-4 text-red-600 hover:bg-red-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        <button type="button" onClick={() => onToggleRead(message)} className="btn-secondary w-auto px-4">
          Mark as {message.readAt ? "unread" : "read"}
        </button>
        <a href={mailtoHref(message)} className="btn-primary w-auto px-4">
          <MailIcon className="h-4 w-4" />
          Reply by email
        </a>
      </div>
    </Modal>
  );
}

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [loadError, setLoadError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async (searchTerm, filterValue) => {
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filterValue === "unread") params.set("filter", "unread");
      const qs = params.toString();
      const res = await fetch(`/api/admin/messages${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Could not load messages.");
        return;
      }
      setMessages(data.messages);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setLoadError("Could not reach the server.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search, filter), 250);
    return () => clearTimeout(timer);
  }, [search, filter, load]);

  async function setRead(message, read) {
    const res = await fetch(`/api/admin/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages((prev) => {
      // In the "Unread" tab, a message that just got marked read no
      // longer belongs in the list — drop it instead of leaving a stale
      // "read" row under an Unread filter.
      const list =
        filter === "unread" && read
          ? (prev || []).filter((m) => m.id !== message.id)
          : (prev || []).map((m) => (m.id === message.id ? data.message : m));
      setUnreadCount(list.filter((m) => !m.readAt).length);
      return list;
    });
    setViewing((prev) => (prev && prev.id === message.id ? data.message : prev));
  }

  function openMessage(message) {
    setViewing(message);
    if (!message.readAt) setRead(message, true);
  }

  async function handleDelete(message) {
    if (!window.confirm(`Delete the message from "${message.name}"? This can't be undone.`)) return;
    setDeletingId(message.id);
    try {
      const res = await fetch(`/api/admin/messages/${message.id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => (prev || []).filter((m) => m.id !== message.id));
        setUnreadCount((prev) => (message.readAt ? prev : Math.max(0, prev - 1)));
        setViewing((prev) => (prev && prev.id === message.id ? null : prev));
      } else {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || "Could not delete this message.");
      }
    } catch {
      setLoadError("Could not reach the server.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or subject…"
            className="field-input pl-9"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "btn-primary w-auto px-4" : "btn-secondary w-auto px-4"}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "btn-primary w-auto px-4" : "btn-secondary w-auto px-4"}
          >
            Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        </div>
      </div>

      {loadError && <div className="alert-error mb-0">{loadError}</div>}

      <div className="card card-hover overflow-hidden">
        {messages === null ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-400">
            <Spinner className="h-4 w-4" /> Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <MailIcon className="h-8 w-8 text-ink-300" />
            <p className="text-sm font-medium text-ink-600">No messages yet</p>
            <p className="max-w-xs text-xs text-ink-400">
              Submissions from the landing page&apos;s contact form will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">From</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Received</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {messages.map((message) => (
                  <tr key={message.id} className={`transition hover:bg-ink-50/60 ${message.readAt ? "" : "bg-brass-50/40"}`}>
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => openMessage(message)} className="text-left">
                        <div className="flex items-center gap-2">
                          {!message.readAt && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-brass-500" aria-label="Unread" />
                          )}
                          <div className="min-w-0">
                            <p className={`truncate text-sm ${message.readAt ? "font-medium text-ink-800" : "font-semibold text-ink-900"}`}>
                              {message.name}
                            </p>
                            <p className="truncate text-xs text-ink-400">{message.email}</p>
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => openMessage(message)} className="max-w-xs truncate text-left text-ink-700">
                        {message.subject}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-ink-500">{formatDate(message.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => openMessage(message)} className="btn-ghost px-2.5 py-1.5 text-xs">
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setRead(message, !message.readAt)}
                          className="btn-ghost px-2.5 py-1.5 text-xs"
                        >
                          Mark {message.readAt ? "unread" : "read"}
                        </button>
                        <a href={mailtoHref(message)} className="btn-ghost px-2.5 py-1.5 text-xs">
                          Reply
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(message)}
                          disabled={deletingId === message.id}
                          className="btn-ghost px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          {deletingId === message.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <TrashIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <MessageDetailModal
          message={viewing}
          onClose={() => setViewing(null)}
          onToggleRead={(m) => setRead(m, !m.readAt)}
          onDelete={handleDelete}
          deleting={deletingId === viewing.id}
        />
      )}
    </div>
  );
}
