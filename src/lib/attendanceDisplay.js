// Shared helpers for Day 7 attendance: window math, status display and
// date/time formatting. Kept framework-agnostic (no "use client") so both
// API routes and client components can import from here, the same split as
// taskDisplay.js for the Day 5/6 slice.

export const ATTENDANCE_STATUS_META = {
  PRESENT: { label: "Present", badge: "bg-emerald-50 text-emerald-700" },
  LATE: { label: "Late", badge: "bg-brass-50 text-brass-700" },
  ABSENT: { label: "Absent", badge: "bg-red-50 text-red-700" },
};

export function attendanceStatusLabel(status) {
  return ATTENDANCE_STATUS_META[status]?.label ?? status;
}

// today's date as yyyy-MM-dd in local time — used both as the default date
// for the teacher's roster and to key a student's "today" record.
export function todayDateString(reference = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${reference.getFullYear()}-${pad(reference.getMonth() + 1)}-${pad(reference.getDate())}`;
}

function minutesSinceMidnight(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// PRD section 20: a student can only mark attendance while "now" falls
// inside the course's configured window. A course with no window
// configured yet (attendanceWindowStart/End both null) never accepts
// self-marking — an Admin/Teacher has to set it up first (PRD section 19).
export function isWithinAttendanceWindow(course, reference = new Date()) {
  if (!course?.attendanceWindowStart || !course?.attendanceWindowEnd) return false;
  const nowMinutes = reference.getHours() * 60 + reference.getMinutes();
  return (
    nowMinutes >= minutesSinceMidnight(course.attendanceWindowStart) &&
    nowMinutes <= minutesSinceMidnight(course.attendanceWindowEnd)
  );
}

// "14:30" -> "2:30 PM"
export function formatTime(hhmm) {
  if (!hhmm) return "\u2014";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatWindow(course) {
  if (!course?.attendanceWindowStart || !course?.attendanceWindowEnd) return "Not configured";
  return `${formatTime(course.attendanceWindowStart)} \u2013 ${formatTime(course.attendanceWindowEnd)}`;
}

export function formatDateLabel(value) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatMarkedAt(value) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Once an attendance record is this many days old, a teacher can no longer
// freely correct it — like a real SIS/gradebook, historical attendance is
// treated as a closed record. An Admin can grant a one-time exception
// (adminUnlockedAt) when a genuine correction is needed after the window.
export const ATTENDANCE_EDIT_WINDOW_DAYS = 3;

// A brand-new row (no `record` yet) is never "locked" — locking only
// applies to overwriting something that was already saved.
export function isAttendanceRecordLocked(record, reference = new Date()) {
  if (!record?.markedAt) return false;
  if (record.adminUnlocked) return false;
  const ageMs = reference.getTime() - new Date(record.markedAt).getTime();
  return ageMs > ATTENDANCE_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

// Percentage of PRESENT+LATE among total recorded days (PRD sections 21/24
// example: "Attendance: 92%"). A row only exists once a student self-marks
// or a teacher takes attendance for a date, so this is "attendance out of
// days actually tracked" rather than a fixed course calendar — the same
// derive-don't-store approach lecture/course progress use in the Day 4
// slice, since there's no separate "class schedule" model to compare against.
export function attendancePercent(records) {
  if (!records?.length) return 0;
  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return Math.round((present / records.length) * 100);
}
