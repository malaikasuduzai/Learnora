import {
  BellIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  HomeIcon,
  MessageIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";

// Everything here is presentation/config only. Non-dashboard nav items with
// no `active`/`href` are intentionally rendered as "coming soon": the
// routes, data models and screens for those areas are out of scope so far
// and arrive in later phases of the build (see ROADMAP below).
// Enrollments-as-its-own-page stays disabled for now — enrolling students
// is already available from inside a course's detail page in the meantime.
// Modules, lectures and videos (Day 4) and Tasks & submissions (Day 5) are
// live: a Teacher manages them from their own dashboard, and a Student
// consumes/submits them the same way. Grading (Day 6 — marks, feedback,
// approve/reject) is folded into the same "Tasks & submissions" screen
// rather than a separate nav item, since a teacher naturally evaluates a
// submission right where they saw it appear. Attendance (Day 7) is live
// for all three roles: an Admin sets each course's window from
// "Attendance settings", a Teacher takes attendance and reviews the
// summary from "Attendance", and a Student marks themselves present and
// views their history from the same nav item. Announcements and Messages
// (Day 8) are live for Teacher and Student: a Teacher publishes course
// announcements and messages enrolled students from their own nav items;
// a Student reads announcements from their enrolled courses and messages
// each course's teacher the same way. The header notification bell (also
// Day 8) is role-agnostic and lives in DashboardShell rather than here.
// The Student's Progress nav item is also live: it derives a per-course
// and overall breakdown of lecture, task and attendance completion at
// read time from GET /api/student/progress, rather than a stored total.
// Day 10 completes the three remaining "coming soon" items: the Admin's
// Tasks nav is now a platform-wide, read-only view of every task across
// every course (GET /api/admin/tasks) — an Admin observes assignment/
// submission/grading counts, but creating, editing and grading a task
// stays with that course's own teacher. The Super Admin's Reports nav is
// a platform-wide rollup (GET /api/super-admin/reports) of accounts,
// courses, enrollments, task completion, average scores and attendance,
// with a per-course breakdown table. The Teacher's Students nav
// (GET /api/teacher/students) lists every student enrolled across that
// teacher's own courses, each with a per-course breakdown of lecture
// progress, task completion and attendance — the Teacher-side counterpart
// to the Student's own Progress page. All three are derived at read time
// from the same models the rest of the build already writes, the same
// derive-don't-store approach used throughout.
// The Admin's Messages nav is the Contact Messages page: the landing
// page's "Talk to our team" form now writes a ContactMessage row (see
// POST /api/contact) instead of being a static, unwired form, and an
// Admin reads/manages submissions from GET/PATCH/DELETE
// /api/admin/messages. The Super Admin's Messages nav points at the same
// Contact Messages screen and the same /api/admin/messages endpoints —
// requireRole() there already allows both SUPER_ADMIN and ADMIN, so no API
// changes were needed, just the nav entry and a Super-Admin-gated page.

export const ROLE_META = {
  SUPER_ADMIN: {
    label: "Super Admin",
    short: "Super Admin",
    accent: "text-role-superadmin",
    dot: "bg-role-superadmin",
    badge: "bg-role-superadminSoft text-role-superadmin",
    description:
      "Complete control over the platform — every admin, teacher, student and course rolls up to this account.",
    icon: ShieldIcon,
    capabilities: [
      "Create and manage Admin, Teacher and Student accounts",
      "Activate, deactivate or remove any account on the platform",
      "Full visibility into every course, enrollment and report",
    ],
  },
  ADMIN: {
    label: "Admin",
    short: "Admin",
    accent: "text-role-admin",
    dot: "bg-role-admin",
    badge: "bg-role-adminSoft text-role-admin",
    description:
      "Runs day-to-day academic operations: courses, teacher assignments, enrollments and attendance rules.",
    icon: UsersIcon,
    capabilities: [
      "Create courses and assign a teacher to each one",
      "Enroll students and manage course categories",
      "Configure attendance windows and oversee tasks",
    ],
  },
  TEACHER: {
    label: "Teacher",
    short: "Teacher",
    accent: "text-role-teacher",
    dot: "bg-role-teacher",
    badge: "bg-role-teacherSoft text-role-teacher",
    description:
      "Manages assigned courses end to end — lectures, tasks, submissions, attendance and student progress.",
    icon: GraduationCapIcon,
    capabilities: [
      "Build modules, lectures and course resources",
      "Create tasks, set deadlines and grade submissions",
      "Take attendance and message enrolled students",
    ],
  },
  STUDENT: {
    label: "Student",
    short: "Student",
    accent: "text-role-student",
    dot: "bg-role-student",
    badge: "bg-role-studentSoft text-role-student",
    description:
      "Learns at their own pace — enrolled courses, lectures, tasks, attendance and progress in one place.",
    icon: BookOpenIcon,
    capabilities: [
      "Browse and enroll in available courses",
      "Watch lectures and submit assignments",
      "Mark daily attendance and track course progress",
    ],
  },
};

export const NAV_ITEMS = {
  SUPER_ADMIN: [
    { label: "Overview", icon: HomeIcon, href: "/super-admin", active: true },
    { label: "Admins", icon: ShieldIcon, href: "/super-admin/admins", active: true },
    { label: "Teachers", icon: UsersIcon, href: "/super-admin/teachers", active: true },
    { label: "Students", icon: UsersIcon, href: "/super-admin/students", active: true },
    { label: "Courses", icon: BookOpenIcon, href: "/super-admin/courses", active: true },
    { label: "Reports", icon: ClipboardListIcon, href: "/super-admin/reports", active: true },
    { label: "Messages", icon: MessageIcon, href: "/super-admin/messages", active: true },
    { label: "Settings", icon: SettingsIcon, href: "/super-admin/settings", active: true },
  ],
  ADMIN: [
    { label: "Overview", icon: HomeIcon, href: "/admin", active: true },
    { label: "Courses", icon: BookOpenIcon, href: "/admin/courses", active: true },
    { label: "Teachers", icon: UsersIcon, href: "/admin/teachers", active: true },
    { label: "Students", icon: UsersIcon, href: "/admin/students", active: true },
    { label: "Attendance settings", icon: CalendarCheckIcon, href: "/admin/attendance", active: true },
    { label: "Tasks", icon: ClipboardListIcon, href: "/admin/tasks", active: true },
    { label: "Messages", icon: MessageIcon, href: "/admin/messages", active: true },
    { label: "Settings", icon: SettingsIcon, href: "/admin/settings", active: true },
  ],
  TEACHER: [
    { label: "Overview", icon: HomeIcon, href: "/teacher", active: true },
    { label: "My courses", icon: BookOpenIcon, href: "/teacher/courses", active: true },
    { label: "Tasks & submissions", icon: ClipboardListIcon, href: "/teacher/tasks", active: true },
    { label: "Attendance", icon: CalendarCheckIcon, href: "/teacher/attendance", active: true },
    { label: "Students", icon: UsersIcon, href: "/teacher/students", active: true },
    { label: "Announcements", icon: BellIcon, href: "/teacher/announcements", active: true },
    { label: "Messages", icon: MessageIcon, href: "/teacher/messages", active: true },
    { label: "Settings", icon: SettingsIcon, href: "/teacher/settings", active: true },
  ],
  STUDENT: [
    { label: "Overview", icon: HomeIcon, href: "/student", active: true },
    { label: "My courses", icon: BookOpenIcon, href: "/student/courses", active: true },
    { label: "Browse courses", icon: SearchIcon, href: "/student/courses/browse", active: true },
    { label: "Tasks", icon: ClipboardListIcon, href: "/student/tasks", active: true },
    { label: "Attendance", icon: CalendarCheckIcon, href: "/student/attendance", active: true },
    { label: "Progress", icon: GraduationCapIcon, href: "/student/progress", active: true },
    { label: "Announcements", icon: BellIcon, href: "/student/announcements", active: true },
    { label: "Messages", icon: MessageIcon, href: "/student/messages", active: true },
    { label: "Settings", icon: SettingsIcon, href: "/student/settings", active: true },
  ],
};

// Mirrors the 10-day plan in the task brief. Day 3 (this module) is the
// furthest-along phase right now.
export const ROADMAP = [
  { day: 1, title: "Planning & architecture", status: "done" },
  { day: 2, title: "Authentication & user roles", status: "done" },
  { day: 3, title: "Course & teacher management", status: "done" },
  { day: 4, title: "Course content & videos", status: "done" },
  { day: 5, title: "Task & assignment system", status: "done" },
  { day: 6, title: "Evaluation system", status: "done" },
  { day: 7, title: "Attendance system", status: "done" },
  { day: 8, title: "Notifications & communication", status: "done" },
  { day: 9, title: "Testing & UI/UX pass", status: "done" },
  { day: 10, title: "Finalization & submission", status: "done" },
];
