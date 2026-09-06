"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "@/components/icons";

// The header search bar used to be a permanently `disabled` input with a
// "Search ... tools" placeholder — it looked interactive but did nothing
// on every single role's dashboard (Super Admin, Admin, Teacher, Student
// all share this header). This turns it into a real quick-nav search: it
// filters that role's own sidebar destinations by label as you type, so
// typing "attend" from anywhere jumps straight to Attendance instead of
// having to hunt for it in the sidebar.
export default function HeaderSearch({ navItems, roleLabel }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const items = navItems.filter((item) => item.active && item.href);
    if (!term) return items;
    return items.filter((item) => item.label.toLowerCase().includes(term));
  }, [navItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function go(item) {
    if (!item) return;
    router.push(item.href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative hidden flex-1 max-w-sm sm:block">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={`Search ${roleLabel.toLowerCase()} tools…`}
        aria-label={`Search ${roleLabel.toLowerCase()} tools`}
        role="combobox"
        aria-expanded={open}
        aria-controls="header-search-results"
        className="w-full rounded-lg border border-ink-100 bg-ink-50 py-2 pl-9 pr-8 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-ink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-100"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-300 hover:bg-ink-100 hover:text-ink-600"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div
          id="header-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-ink-100 bg-white p-1.5 shadow-panel"
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-ink-400">
              No {roleLabel.toLowerCase()} tools match "{query.trim()}".
            </p>
          ) : (
            results.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                    i === activeIndex ? "bg-ink-50 text-ink-900" : "text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  {ItemIcon && <ItemIcon className="h-4 w-4 shrink-0 text-ink-400" />}
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
