"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import HeaderSearch from "@/components/HeaderSearch";
import RolePageHeader from "@/components/RolePageHeader";
import { BookOpenIcon, ChevronDownIcon, LinkIcon } from "@/components/icons";
import { NAV_ITEMS, ROLE_META } from "@/lib/dashboardConfig";
import SuperAdminOverview from "@/components/dashboard/SuperAdminOverview";
import AdminOverview from "@/components/dashboard/AdminOverview";
import TeacherOverview from "@/components/dashboard/TeacherOverview";
import StudentOverview from "@/components/dashboard/StudentOverview";
import SettingsPanel from "@/components/dashboard/SettingsPanel";

const OVERVIEW_BY_ROLE = {
  SUPER_ADMIN: SuperAdminOverview,
  ADMIN: AdminOverview,
  TEACHER: TeacherOverview,
  STUDENT: StudentOverview,
};

// Maps a user's role to the role key RolePageHeader expects, so the
// Overview and Settings header (rendered here) matches the same
// RolePageHeader styling every other section already uses.
const ROLE_HEADER_KEY = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
};

// Where "Explore Courses" sends each role — the student's public browse
// screen for a Student, and each role's own course-management screen for
// everyone else (there's no separate "browse" screen for those roles yet).
const EXPLORE_COURSES_HREF = {
  SUPER_ADMIN: "/super-admin/courses",
  ADMIN: "/admin/courses",
  TEACHER: "/teacher/courses",
  STUDENT: "/student/courses/browse",
};

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Sidebar({ user, meta, navItems, onNavigate, pathname }) {
  return (
    <div className="flex h-full flex-col bg-ink-950 text-white">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-500 font-display text-base font-semibold text-ink-950">
          L
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-none text-white">
            Learnora
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-400">
            Learning Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 scrollbar-thin">
        {navItems.map((item) => {
          const ItemIcon = item.icon;
          if (item.active) {
            const isCurrent = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={`nav-item ${isCurrent ? "nav-item-active" : ""}`}
              >
                <ItemIcon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          }
          return (
            <div key={item.label} className="nav-item cursor-default opacity-50">
              <ItemIcon className="h-[18px] w-[18px]" />
              {item.label}
            </div>
          );
        })}
      </nav>

      <div className="mx-3 mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
        <span className={`text-xs font-semibold ${meta.accent}`}>{meta.label} access</span>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      {/* Account block, pinned to the bottom of every sidebar/pane so the
          signed-in user and quick actions are always one glance away. */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${meta.dot}`}
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white">
              {user.name}
            </p>
            <p className="truncate text-xs leading-tight text-ink-400">{user.email}</p>
          </div>
        </div>

        <div className="mt-2 border-t border-white/10 pt-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-300 transition hover:bg-white/5 hover:text-white"
          >
            <LinkIcon className="h-4 w-4" />
            View live site
          </Link>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ user, meta }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2.5 text-left transition hover:bg-ink-50"
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${meta.dot}`}
        >
          {initials(user.name)}
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-semibold leading-tight text-ink-900">
            {user.name}
          </span>
          <span className="block text-xs leading-tight text-ink-400">{meta.label}</span>
        </span>
        <ChevronDownIcon className="hidden h-4 w-4 text-ink-400 sm:block" />
      </button>

      {open && (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-ink-100 bg-white p-1.5 shadow-panel">
            <div className="border-b border-ink-100 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-400">{user.email}</p>
            </div>
            <div className="p-1.5">
              <LogoutButton variant="menu" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardShell({ user, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const meta = ROLE_META[user.role];
  const navItems = NAV_ITEMS[user.role] ?? [];
  const RoleIcon = meta.icon;
  const Overview = OVERVIEW_BY_ROLE[user.role];
  const isSettings = pathname?.endsWith("/settings");

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* `sticky top-0 h-screen self-start` pins the sidebar to the viewport
          instead of letting it stretch to the height of the main content
          column (its flex row sibling) and scroll away with the page. */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:self-start">
        <Sidebar user={user} meta={meta} navItems={navItems} pathname={pathname} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-panel">
            <Sidebar
              user={user}
              meta={meta}
              navItems={navItems}
              pathname={pathname}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="btn-ghost -ml-2 px-2 lg:hidden"
              aria-label="Open navigation"
            >
              <span className="block h-0.5 w-5 bg-current before:absolute before:-mt-2 before:block before:h-0.5 before:w-5 before:bg-current after:absolute after:mt-2 after:block after:h-0.5 after:w-5 after:bg-current" />
            </button>

            <HeaderSearch navItems={navItems} roleLabel={meta.label} />

            <div className="ml-auto flex items-center gap-1.5">
              <NotificationBell />
              <UserMenu user={user} meta={meta} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children ? (
            children
          ) : (
            <>
              <RolePageHeader
                role={ROLE_HEADER_KEY[user.role]}
                icon={RoleIcon}
                title={isSettings ? "Account settings" : `Welcome back, ${user.name.split(" ")[0]}`}
                description={
                  isSettings
                    ? "Update your profile information and password."
                    : meta.description
                }
                action={
                  isSettings ? (
                    <span className="badge bg-emerald-50 text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active account
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="badge bg-emerald-50 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active account
                      </span>
                      <Link
                        href={EXPLORE_COURSES_HREF[user.role] ?? "/"}
                        className="btn-brass w-auto px-4 py-2"
                      >
                        <BookOpenIcon className="h-4 w-4" />
                        Explore Courses
                      </Link>
                      <LogoutButton />
                    </div>
                  )
                }
              />

              <div className="mt-8">
                {isSettings ? <SettingsPanel user={user} /> : Overview && <Overview />}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
