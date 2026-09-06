"use client";

import { useEffect, useRef, useState } from "react";
import Spinner from "@/components/Spinner";
import { ArrowLeftIcon, MessageIcon, PencilIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { formatMessageTime, initials } from "@/lib/communicationDisplay";

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// Shared two-pane messaging UI for both the Teacher and Student sides
// (PRD section 30). The only difference between the two roles is how a
// conversation is addressed and how its API paths are built, so those are
// injected as props rather than duplicating this whole layout twice.
export default function MessageThread({
  listUrl,
  threadUrl,
  messageUrl,
  conversationKey,
  otherPartyLabel,
  emptyTitle,
  emptyBody,
  noConversationsTitle,
  noConversationsBody,
}) {
  const [conversations, setConversations] = useState(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [activeKey, setActiveKey] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadError, setThreadError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEditId, setSavingEditId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState("");
  const bottomRef = useRef(null);

  async function loadConversations() {
    try {
      const data = await api(listUrl);
      setConversations(data.conversations);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  useEffect(() => {
    loadConversations();
    const refresh = window.setInterval(loadConversations, 15000);
    return () => window.clearInterval(refresh);
  }, []);

  async function openConversation(conversation) {
    const key = conversationKey(conversation);
    setActiveKey(key);
    setShowThreadOnMobile(true);
    setThread(null);
    setThreadError("");
    setEditingId(null);
    setConfirmingDeleteId(null);
    setRowError("");
    try {
      const data = await api(threadUrl(conversation));
      setThread(data);
      setConversations((prev) =>
        prev.map((c) => (conversationKey(c) === key ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      setThreadError(err.message);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function handleSend(e, conversation) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setThreadError("");
    try {
      const { message } = await api(threadUrl(conversation), {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setThread((prev) => ({ ...prev, messages: [...prev.messages, message] }));
      setDraft("");
      loadConversations();
    } catch (err) {
      setThreadError(err.message);
    } finally {
      setSending(false);
    }
  }

  function startEdit(message) {
    setRowError("");
    setConfirmingDeleteId(null);
    setEditingId(message.id);
    setEditDraft(message.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function handleSaveEdit(conversation, messageId) {
    const body = editDraft.trim();
    if (!body) return;
    setSavingEditId(messageId);
    setRowError("");
    try {
      const { message } = await api(messageUrl(conversation, messageId), {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      setThread((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === messageId ? message : m)),
      }));
      setEditingId(null);
    } catch (err) {
      setRowError(err.message);
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDelete(conversation, messageId) {
    setDeletingId(messageId);
    setRowError("");
    try {
      const { message } = await api(messageUrl(conversation, messageId), { method: "DELETE" });
      setThread((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === messageId ? message : m)),
      }));
      setConfirmingDeleteId(null);
    } catch (err) {
      setRowError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (loadError && !conversations) return <div className="alert-error">{loadError}</div>;

  if (!conversations) {
    return (
      <div className="card flex items-center justify-center gap-2 py-16 text-sm text-ink-400">
        <Spinner className="h-4 w-4" /> Loading messages…
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="card card-hover flex flex-col items-center gap-2 py-16 text-center">
        <MessageIcon className="h-8 w-8 text-ink-300" />
        <p className="text-sm font-medium text-ink-600">{noConversationsTitle}</p>
        <p className="max-w-xs text-xs text-ink-400">{noConversationsBody}</p>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => conversationKey(c) === activeKey) ?? null;

  return (
    <div className="card grid h-[34rem] overflow-hidden lg:grid-cols-[280px_1fr]">
      <div
        className={`flex-col overflow-y-auto overscroll-contain border-ink-100 lg:flex lg:border-r ${
          showThreadOnMobile ? "hidden" : "flex"
        } min-h-0`}
      >
        <div className="border-b border-ink-100 p-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <input
              type="search"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search people or courses…"
              className="field-input pl-9 text-xs"
            />
          </div>
          <p className="mt-2 px-1 text-[11px] text-ink-400">{conversations.length} conversation{conversations.length === 1 ? "" : "s"}</p>
        </div>
        <div className="divide-y divide-ink-100">
        {(() => {
          const term = conversationSearch.trim().toLowerCase();
          const filteredConversations = conversations.filter((c) =>
            !term || `${otherPartyLabel(c)} ${c.course.title}`.toLowerCase().includes(term)
          );
          if (filteredConversations.length === 0) {
            return (
              <p className="px-4 py-8 text-center text-sm text-ink-400">
                No conversations match "{conversationSearch.trim()}".
              </p>
            );
          }
          return filteredConversations.map((c) => {
          const key = conversationKey(c);
          const label = otherPartyLabel(c);
          return (
            <button
              key={key}
              type="button"
              onClick={() => openConversation(c)}
              className={`flex items-start gap-2.5 px-4 py-3 text-left transition hover:bg-ink-50 ${
                key === activeKey ? "bg-ink-50" : ""
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-role-studentSoft text-xs font-semibold text-role-student">
                {initials(label)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink-800">{label}</span>
                  {c.unreadCount > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brass-500 px-1 text-[10px] font-bold leading-none text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-ink-400">{c.course.title}</span>
                {c.lastMessage && (
                  <span className="mt-0.5 block truncate text-xs text-ink-400">
                    {c.lastMessage.body}
                  </span>
                )}
              </span>
            </button>
          );
          });
        })()}
        </div>
      </div>

      <div className={`min-h-0 flex-col ${showThreadOnMobile ? "flex" : "hidden lg:flex"}`}>
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <MessageIcon className="h-8 w-8 text-ink-300" />
            <p className="text-sm font-medium text-ink-600">{emptyTitle}</p>
            <p className="max-w-xs text-xs text-ink-400">{emptyBody}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-ink-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowThreadOnMobile(false)}
                className="btn-ghost -ml-1.5 px-2 lg:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {otherPartyLabel(activeConversation)}
                </p>
                <p className="truncate text-xs text-ink-400">{activeConversation.course.title}</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 scrollbar-thin">
              {!thread && !threadError && (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-400">
                  <Spinner className="h-4 w-4" /> Loading conversation…
                </div>
              )}
              {threadError && <p className="alert-error mb-0">{threadError}</p>}
              {rowError && <p className="alert-error mb-2">{rowError}</p>}
              {thread?.messages?.length === 0 && (
                <p className="py-8 text-center text-sm text-ink-400">
                  No messages yet — say hello.
                </p>
              )}
              <div className="space-y-3">
                {thread?.messages?.map((m) => {
                  const mine = m.senderId === thread.you;
                  const isDeleted = Boolean(m.deletedAt);
                  const isEditing = editingId === m.id;

                  if (isDeleted) {
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[80%] rounded-2xl border border-dashed border-ink-200 px-3.5 py-2 text-sm italic text-ink-300">
                          {mine ? "You deleted this message" : "This message was deleted"}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                      {mine && messageUrl && !isEditing && (
                        <div className="mr-1.5 flex items-center gap-1 self-center opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            aria-label="Edit message"
                            className="rounded p-1 text-ink-300 hover:bg-ink-100 hover:text-ink-600"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(m.id)}
                            aria-label="Delete message"
                            className="rounded p-1 text-ink-300 hover:bg-red-50 hover:text-red-500"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine
                            ? "bg-ink-900 text-white"
                            : "border border-ink-100 bg-ink-50 text-ink-800"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(activeConversation, m.id);
                                }
                                if (e.key === "Escape") cancelEdit();
                              }}
                              rows={2}
                              autoFocus
                              className="w-full resize-none rounded-lg border-0 bg-white/10 p-1.5 text-sm text-inherit outline-none ring-1 ring-white/20 placeholder:text-white/40"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="text-xs font-medium text-white/70 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(activeConversation, m.id)}
                                disabled={savingEditId === m.id || !editDraft.trim()}
                                className="text-xs font-semibold text-white hover:underline"
                              >
                                {savingEditId === m.id ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-white/60" : "text-ink-400"}`}>
                              {formatMessageTime(m.createdAt)}
                              {m.editedAt && <span>· edited</span>}
                            </p>
                            {confirmingDeleteId === m.id && (
                              <div
                                className={`mt-1.5 flex items-center gap-2 rounded-lg p-1.5 text-xs ${
                                  mine ? "bg-white/10" : "bg-white"
                                }`}
                              >
                                <span>Delete this message?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(activeConversation, m.id)}
                                  disabled={deletingId === m.id}
                                  className="font-semibold text-red-400 hover:underline"
                                >
                                  {deletingId === m.id ? "Deleting…" : "Delete"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className={mine ? "text-white/70 hover:text-white" : "text-ink-400 hover:text-ink-600"}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => handleSend(e, activeConversation)}
              className="flex items-end gap-2 border-t border-ink-100 p-3"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e, activeConversation);
                  }
                }}
                rows={1}
                placeholder="Write a message…"
                className="field-textarea flex-1 resize-none"
              />
              <button type="submit" disabled={sending || !draft.trim()} className="btn-primary w-auto px-4">
                {sending ? <Spinner className="h-4 w-4" /> : "Send"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
