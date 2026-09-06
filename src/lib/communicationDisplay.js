// Shared helpers for Day 8: notifications, announcements & messaging.
// Kept framework-agnostic (no "use client") so both API routes and client
// components can import from here, the same split as attendanceDisplay.js
// and taskDisplay.js for earlier phases.

export const NOTIFICATION_TYPE_META = {
  ENROLLMENT: { icon: "📚" },
  LECTURE_ADDED: { icon: "🎬" },
  TASK_ASSIGNED: { icon: "📝" },
  TASK_SUBMITTED: { icon: "📥" },
  TASK_EVALUATED: { icon: "✅" },
  ANNOUNCEMENT: { icon: "📢" },
  MESSAGE: { icon: "💬" },
  ATTENDANCE_REMINDER: { icon: "🟢" },
};

export function notificationIcon(type) {
  return NOTIFICATION_TYPE_META[type]?.icon ?? "🔔";
}

// "2 hours ago" / "Yesterday" / "3 days ago" / "Aug 12" — used for both
// notifications and message timestamps.
export function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Short clock time for a message bubble, e.g. "2:30 PM".
export function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export { initials };
