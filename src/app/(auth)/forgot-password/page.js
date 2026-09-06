"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";
import { ArrowLeftIcon } from "@/components/icons";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors?.email) setFieldError(data.fieldErrors.email);
        else setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      sessionStorage.setItem("lms_reset_email", email);
      // Dev-mode convenience: no email provider is wired up yet, so the
      // API hands the code back directly instead of it only reaching a
      // server console.
      if (data.devCode) sessionStorage.setItem("lms_reset_dev_code", data.devCode);

      router.push("/verify-code");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <Link
        href="/login"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to login
      </Link>

      <p className="eyebrow mb-2">Reset password</p>
      <h1 className="mb-1 font-display text-2xl font-semibold text-ink-900">
        Forgot your password?
      </h1>
      <p className="mb-6 text-sm text-ink-500">
        Enter your account email and we&apos;ll send a 6-digit code to verify it&apos;s you.
      </p>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Email address"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Sending code..." : "Send code"}
        </button>
      </form>
    </div>
  );
}
