"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";

const INITIAL_FORM = { email: "", password: "" };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const justRegistered = searchParams.get("registered") === "1";
  const justReset = searchParams.get("reset") === "1";

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        else setFormError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Only honor callbackUrl if it points back into our own app's
      // protected area — never redirect to an external URL from a query param.
      const safeCallback =
        callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : null;

      router.push(safeCallback || data.redirectTo || "/");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="eyebrow mb-2">Sign in</p>
      <h1 className="mb-1 font-display text-2xl font-semibold text-ink-900">Welcome back</h1>
      <p className="mb-6 text-sm text-ink-500">Log in to continue to your dashboard.</p>

      {justRegistered && (
        <div className="alert-success">Account created. Please log in.</div>
      )}
      {justReset && (
        <div className="alert-success">Password updated. Please log in with your new password.</div>
      )}
      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Your password"
          autoComplete="current-password"
          rightElement={
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brass-600 hover:text-brass-700"
            >
              Forgot password?
            </Link>
          }
        />

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brass-600 hover:text-brass-700">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
