"use client";

import { useEffect, useRef, useState } from "react";
import Spinner from "@/components/Spinner";
import { 
  ArrowLeftIcon, 
  MessageIcon, 
  PencilIcon, 
  SearchIcon, 
  TrashIcon,
  BellIcon 
} from "@/components/icons";
import { formatMessageTime, initials } from "@/lib/communicationDisplay";
import MessageNotificationSettings from "@/components/MessageNotificationSettings";

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// Enhanced MessageThread with consistent styling, notification settings, 
// message scroller, edit timestamps, and message highlighting
export default function MessageThreadEnhanced({
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
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState({
    enabled: true,
    sound: true,
    desktop: true,
    emailDigest: false,
  });
  
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (smooth = true) => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ 
          behavior: smooth ? "smooth" : "auto",
          block: "nearest"
        });
      }
    }, 50);
  };

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
    return () => {
      window.clearInterval(refresh);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
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
    setMessageSearch("");
    setHighlightedMessageId(null);
    try {
      const data = await api(threadUrl(conversation));
      setThread(data);
      setConversations((prev) =>
        prev.map((c) => (conversationKey(c) === key ? { ...c, unreadCount: 0 } : c))
      );
      
      // Auto-scroll to bottom after loading thread
      setTimeout(() => scrollToBottom(false), 100);
    } catch (err) {
      setThreadError(err.message);
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (thread?.messages?.length) {
      scrollToBottom(true);
    }
  }, [thread?.messages?.length]);

  // Highlight search results
  useEffect(() => {
    if (messageSearch.trim()) {
      const searchLower = messageSearch.toLowerCase();
      const foundMessage = thread?.messages?.find(m => 
        m.body.toLowerCase().includes(searchLower)
      );
      if (foundMessage) {
        setHighlightedMessageId(foundMessage.id);
      }
    } else {
      setHighlightedMessageId(null);
    }
  }, [messageSearch, thread?.messages]);

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
      const { message } = await api(messageUrl(conversation, messageId), { 
        method: "DELETE" 
      });
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

  // Format full edit timestamp
  const formatEditTime = (editedAt) => {
    if (!editedAt) return null;
    const edited = new Date(editedAt);
    return edited.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
  const filteredMessages = thread?.messages?.filter(m => {
    if (!messageSearch.trim()) return true;
    return !m.deletedAt && m.body.toLowerCase().includes(messageSearch.toLowerCase());
  }) ?? [];

  return (
    <div className="card grid h-[34rem] overflow-hidden lg:grid-cols-[280px_1fr] bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Conversations List */}
      <div
        className={`flex-col overflow-y-auto border-ink-100 lg:flex lg:border-r ${
          showThreadOnMobile ? "hidden" : "flex"
        } min-h-0 bg-white`}
      >
        <div className="border-b border-slate-200 p-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search people or courses…"
              className="field-input pl-9 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {(() => {
            const filtered = conversations.filter((c) => {
              const searchLower = conversationSearch.toLowerCase();
              return (
                otherPartyLabel(c).toLowerCase().includes(searchLower) ||
                c.course.title.toLowerCase().includes(searchLower)
              );
            });

            if (filtered.length === 0) {
              return (
                <div className="p-4 text-center text-xs text-ink-400">
                  No conversations found
                </div>
              );
            }

            return filtered.map((c) => {
              const key = conversationKey(c);
              const isActive = key === activeKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openConversation(c)}
                  className={`w-full border-b border-slate-100 px-3 py-2.5 text-left transition-all duration-200 hover:bg-blue-50 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500"
                      : "hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {otherPartyLabel(c)}
                      </p>
                      <span className="block truncate text-xs text-ink-500">{c.course.title}</span>
                      {c.lastMessage && (
                        <span className="mt-1 block truncate text-xs text-ink-400 italic">
                          {c.lastMessage.body}
                        </span>
                      )}
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`min-h-0 flex-col ${showThreadOnMobile ? "flex" : "hidden lg:flex"} bg-gradient-to-b from-slate-50 via-white to-slate-50`}>
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <MessageIcon className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">{emptyTitle}</p>
            <p className="max-w-xs text-xs text-slate-400">{emptyBody}</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setShowThreadOnMobile(false)}
                  className="btn-ghost -ml-1.5 px-2 lg:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {otherPartyLabel(activeConversation)}
                  </p>
                  <p className="truncate text-xs text-slate-500">{activeConversation.course.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="btn-ghost px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                title="Notification settings"
              >
                <BellIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Notification Settings Panel */}
            {showNotificationSettings && (
              <MessageNotificationSettings
                prefs={notificationPrefs}
                onChange={setNotificationPrefs}
                onClose={() => setShowNotificationSettings(false)}
              />
            )}

            {/* Message Search */}
            <div className="border-b border-slate-200 bg-white px-4 py-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search messages…"
                  className="field-input pl-9 text-xs py-1.5 border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Messages Container */}
            <div 
              ref={messagesContainerRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 space-y-3"
            >
              {!thread && !threadError && (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
                  <Spinner className="h-4 w-4" /> Loading conversation…
                </div>
              )}
              {threadError && <p className="alert-error mb-0">{threadError}</p>}
              {rowError && <p className="alert-error mb-2">{rowError}</p>}
              
              {messageSearch.trim() && filteredMessages.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No messages match "{messageSearch}"
                </p>
              )}
              
              {!messageSearch.trim() && thread?.messages?.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No messages yet — say hello.
                </p>
              )}

              {/* Messages List */}
              {thread?.messages?.map((m) => {
                const mine = m.senderId === thread.you;
                const isDeleted = Boolean(m.deletedAt);
                const isEditing = editingId === m.id;
                const isHighlighted = highlightedMessageId === m.id && messageSearch.trim();
                const editTime = formatEditTime(m.editedAt);

                if (isDeleted) {
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[80%] rounded-2xl border-2 border-dashed border-slate-200 px-3.5 py-2 text-sm italic text-slate-400">
                        {mine ? "You deleted this message" : "This message was deleted"}
                      </div>
                    </div>
                  );
                }

                // Skip message if search is active and it doesn't match
                if (messageSearch.trim() && !m.body.toLowerCase().includes(messageSearch.toLowerCase())) {
                  return null;
                }

                return (
                  <div 
                    key={m.id} 
                    className={`group flex transition-all duration-200 ${mine ? "justify-end" : "justify-start"} ${
                      isHighlighted ? "scale-105 origin-center" : ""
                    }`}
                  >
                    {mine && messageUrl && !isEditing && (
                      <div className="mr-1.5 flex items-center gap-1 self-center opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          aria-label="Edit message"
                          className="rounded p-1.5 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(m.id)}
                          aria-label="Delete message"
                          className="rounded p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm shadow-sm transition-all duration-200 ${
                        mine
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md"
                          : "border-2 border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                      } ${isHighlighted ? "ring-2 ring-yellow-400 ring-offset-2" : ""}`}
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
                            className="w-full resize-none rounded-lg border-0 bg-white/10 p-2 text-sm text-inherit outline-none ring-1 ring-white/30 placeholder:text-white/50"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-xs font-medium text-white/70 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(activeConversation, m.id)}
                              disabled={savingEditId === m.id || !editDraft.trim()}
                              className="text-xs font-bold text-white hover:text-white/90 transition-colors disabled:opacity-50"
                            >
                              {savingEditId === m.id ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium ${
                            mine ? "text-white/70" : "text-slate-500"
                          }`}>
                            <span>{formatMessageTime(m.createdAt)}</span>
                            {m.editedAt && (
                              <span className="flex items-center gap-1">
                                <span>·</span>
                                <span title={`Edited: ${editTime}`} className="cursor-help">
                                  edited at {editTime}
                                </span>
                              </span>
                            )}
                          </div>
                          {confirmingDeleteId === m.id && (
                            <div
                              className={`mt-2.5 flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-xs font-medium ${
                                mine ? "bg-white/10" : "bg-slate-100"
                              }`}
                            >
                              <span>Delete this message?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(activeConversation, m.id)}
                                disabled={deletingId === m.id}
                                className="font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                {deletingId === m.id ? "Deleting…" : "Delete"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingDeleteId(null)}
                                className={mine ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-slate-700"}
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
              <div ref={bottomRef} />
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={(e) => handleSend(e, activeConversation)}
              className="flex items-end gap-3 border-t border-slate-200 bg-white p-4"
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
                className="field-textarea flex-1 resize-none border-slate-200 focus:border-blue-400 focus:ring-blue-100"
              />
              <button 
                type="submit" 
                disabled={sending || !draft.trim()} 
                className="btn-primary w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Spinner className="h-4 w-4" /> : "Send"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
