"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "@/components/icons";
import Spinner from "@/components/Spinner";

export default function LogoutButton({ variant = "default" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (variant === "menu") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? <Spinner className="h-4 w-4" /> : <LogOutIcon className="h-4 w-4" />}
        {loading ? "Logging out..." : "Log out"}
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-300 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
      >
        {loading ? <Spinner className="h-4 w-4" /> : <LogOutIcon className="h-4 w-4" />}
        {loading ? "Logging out..." : "Log out"}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn-secondary"
    >
      {loading ? <Spinner className="h-4 w-4" /> : <LogOutIcon className="h-4 w-4" />}
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
