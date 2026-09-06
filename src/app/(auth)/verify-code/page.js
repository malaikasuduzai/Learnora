"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { ArrowLeftIcon } from "@/components/icons";

const RESEND_COOLDOWN = 30;

export default function VerifyCodePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("lms_reset_email");
    const devCode = sessionStorage.getItem("lms_reset_dev_code");

    if (!storedEmail) {
      router.replace("/forgot-password");
      return;
    }

    setEmail(storedEmail);
    setCooldown(RESEND_COOLDOWN);
    // Dev convenience only — prefills the code that the API echoed back
    // because no real email provider is configured for this build yet.
    if (devCode) setCode(devCode);
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "That code didn't work. Please try again.");
        return;
      }

      sessionStorage.setItem("lms_reset_token", data.resetToken);
      sessionStorage.removeItem("lms_reset_dev_code");
      router.push("/reset-password");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendMessage("");
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not resend the code. Please try again shortly.");
        return;
      }

      if (data.devCode) {
        sessionStorage.setItem("lms_reset_dev_code", data.devCode);
        setCode(data.devCode);
      }
      setResendMessage("A new code is on its way.");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-card">
      <Link
        href="/forgot-password"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Change email
      </Link>

      <p className="eyebrow mb-2">Verify it&apos;s you</p>
      <h1 className="mb-1 font-display text-2xl font-semibold text-ink-900">Enter your code</h1>
      <p className="mb-6 text-sm text-ink-500">
        We sent a 6-digit code to <span className="font-medium text-ink-700">{email}</span>.
      </p>

      {error && <div className="alert-error">{error}</div>}
      {resendMessage && !error && <div className="alert-success">{resendMessage}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="code" className="field-label">
            6-digit code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="code-input"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || code.length !== 6}
        >
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Verifying..." : "Verify code"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-500">
        Didn&apos;t get a code?{" "}
        {cooldown > 0 ? (
          <span className="font-medium text-ink-400">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-brass-600 hover:text-brass-700 disabled:opacity-60"
          >
            {resending ? "Resending..." : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}
