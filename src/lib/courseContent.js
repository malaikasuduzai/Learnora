// Shared helpers for Day 4 course content: resource display, lecture status
// computation, and turning a raw video URL into something embeddable.
// Kept framework-agnostic (no "use client") so both server routes and
// client components can import from here.

export const RESOURCE_TYPES = [
  { value: "PDF", label: "PDF" },
  { value: "LINK", label: "Link" },
  { value: "FILE", label: "File" },
];

export function resourceTypeLabel(type) {
  return RESOURCE_TYPES.find((t) => t.value === type)?.label ?? type;
}

// Flattens a course's modules -> lectures into a single ordered list
// (module.order, then lecture.order) so "the previous lecture" has one
// unambiguous meaning across module boundaries.
export function flattenLectures(modules) {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const lectures = [];
  for (const mod of sorted) {
    const modLectures = [...mod.lectures].sort((a, b) => a.order - b.order);
    for (const lecture of modLectures) {
      lectures.push({ ...lecture, moduleId: mod.id, moduleTitle: mod.title });
    }
  }
  return lectures;
}

// Given the flattened lecture list and a Set of completed lecture ids,
// returns a Map<lectureId, status> where status is one of "completed",
// "in_progress" (the next lecture a student should watch) or "locked"
// (PRD section 25: "Locked — Object-Oriented Programming"). The first
// lecture is always unlocked; every later lecture unlocks once everything
// before it is completed.
export function computeLectureStatuses(flatLectures, completedIds) {
  const statuses = new Map();
  let unlockedNext = true;
  for (const lecture of flatLectures) {
    const done = completedIds.has(lecture.id);
    if (done) {
      statuses.set(lecture.id, "completed");
    } else if (unlockedNext) {
      statuses.set(lecture.id, "in_progress");
      unlockedNext = false;
    } else {
      statuses.set(lecture.id, "locked");
    }
  }
  return statuses;
}

export function courseProgressPercent(totalLectures, completedCount) {
  if (!totalLectures) return 0;
  return Math.round((completedCount / totalLectures) * 100);
}

// Turns a handful of common "watch page" URLs into embeddable player URLs.
// Anything unrecognized (including direct .mp4 links) is left as-is and
// rendered with a plain <video> tag instead of an iframe.
export function toEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (url.pathname.startsWith("/embed/")) return rawUrl;
    }
    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.replace("/", "");
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function isDirectVideoFile(rawUrl) {
  if (!rawUrl) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(rawUrl.trim());
}
