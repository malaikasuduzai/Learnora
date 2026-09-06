// Shared helpers for Day 5 tasks & submissions: status computation and
// deadline formatting/highlighting. Kept framework-agnostic (no "use
// client") so both API routes and client components can import from here,
// the same split as courseContent.js for the Day 4 slice.

export const TASK_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

export function taskStatusLabel(status) {
  return TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
}

// The five statuses from PRD section 15. SUBMITTED / UNDER_REVIEW /
// COMPLETED / REJECTED come straight from a stored TaskSubmission; PENDING
// and OVERDUE are never stored — they're derived from "no submission yet"
// plus whether `deadline` has passed.
export const STUDENT_TASK_STATUS_META = {
  PENDING: { label: "Pending", badge: "bg-ink-100 text-ink-500" },
  SUBMITTED: { label: "Submitted", badge: "bg-blue-50 text-blue-700" },
  UNDER_REVIEW: { label: "Under Review", badge: "bg-brass-50 text-brass-700" },
  COMPLETED: { label: "Completed", badge: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Rejected", badge: "bg-red-50 text-red-700" },
  OVERDUE: { label: "Overdue", badge: "bg-red-50 text-red-700" },
};

// Given a task (with `deadline`) and this student's submission (or null),
// returns one of the keys in STUDENT_TASK_STATUS_META.
export function computeStudentTaskStatus(task, submission) {
  if (submission) return submission.status;
  return new Date(task.deadline).getTime() < Date.now() ? "OVERDUE" : "PENDING";
}

// PRD section 18: "The system should visually highlight: Upcoming
// Deadline, Deadline Today, Overdue Task." Only meaningful while a task is
// still unsubmitted — callers should skip this once there's a submission.
export function deadlineUrgency(deadline) {
  const due = new Date(deadline).getTime();
  const now = Date.now();
  if (due < now) return "overdue";
  if (due - now <= 24 * 60 * 60 * 1000) return "today";
  return "upcoming";
}

export const DEADLINE_URGENCY_META = {
  overdue: { label: "Overdue", badge: "bg-red-50 text-red-700" },
  today: { label: "Due today", badge: "bg-brass-50 text-brass-700" },
  upcoming: { label: "Upcoming", badge: "bg-ink-100 text-ink-500" },
};

export function formatDateTime(value) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Formats a Date (or ISO string) into yyyy-MM-ddTHH:mm for an
// <input type="datetime-local">, in the browser's local time.
export function toDateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
