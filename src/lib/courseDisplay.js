export const COURSE_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const COURSE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export function levelLabel(level) {
  return COURSE_LEVELS.find((l) => l.value === level)?.label ?? level;
}

export function statusLabel(status) {
  return COURSE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusBadgeClass(status) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700";
    case "ARCHIVED":
      return "bg-ink-100 text-ink-500";
    case "DRAFT":
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function formatDate(value) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Derives a topic-relevant illustrated cover for a real course (created by
// an Admin/Teacher, no stock photo required) by matching its category and
// title against a few keyword groups. Falls back to a generic "book" cover
// for anything that doesn't match, so every course card always has a
// picture instead of a blank placeholder.
const COVER_KEYWORDS = [
  { variant: "web", gradient: "from-brand-500 to-brand-700", words: ["web", "html", "css", "javascript", "react", "frontend", "front-end", "full stack", "fullstack"] },
  { variant: "python", gradient: "from-emerald-500 to-emerald-700", words: ["python", "programming", "coding", "java", "c++", "backend", "back-end"] },
  { variant: "uiux", gradient: "from-rose-400 to-rose-600", words: ["design", "ui", "ux", "graphic", "figma"] },
  { variant: "database", gradient: "from-brass-400 to-brass-600", words: ["database", "sql", "data engineering", "dbms"] },
  { variant: "dsa", gradient: "from-violet-500 to-violet-700", words: ["algorithm", "data structure", "dsa", "problem solving", "competitive"] },
  { variant: "mobile", gradient: "from-sky-400 to-sky-600", words: ["mobile", "android", "ios", "flutter", "swift", "app development"] },
];
const FALLBACK_GRADIENTS = [
  "from-brand-500 to-brand-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-400 to-rose-600",
  "from-brass-400 to-brass-600",
  "from-violet-500 to-violet-700",
  "from-sky-400 to-sky-600",
];

export function courseCover(course) {
  const haystack = `${course?.category?.name ?? ""} ${course?.title ?? ""}`.toLowerCase();
  for (const entry of COVER_KEYWORDS) {
    if (entry.words.some((w) => haystack.includes(w))) {
      return { variant: entry.variant, gradient: entry.gradient };
    }
  }
  // Deterministic fallback so the same course always gets the same look
  // across renders/pages, instead of a random pick each time.
  const seed = (course?.id ?? course?.title ?? "").toString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return { variant: "generic", gradient: FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length] };
}

export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
