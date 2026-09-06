"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "@/components/icons";

export default function LandingNavbar({ navLinks }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#top" className="flex items-center gap-2.5" onClick={close}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 font-display text-base font-semibold text-brass-400">
            L
          </div>
          <div>
            <p className="font-display text-base font-semibold leading-none text-ink-900">
              Learnora
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-400">
              Learning Management
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-ink-500 transition hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-ghost">
            Login
          </Link>
          <Link href="/register" className="btn-primary w-auto px-5">
            Register
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-100 text-ink-700 transition hover:bg-ink-50 md:hidden"
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-paper px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={close}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
            <Link href="/login" className="btn-ghost flex-1 text-center" onClick={close}>
              Login
            </Link>
            <Link href="/register" className="btn-primary flex-1 text-center" onClick={close}>
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
