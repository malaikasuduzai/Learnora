"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";

const INITIAL_FORM = { password: "", confirmPassword: "" };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("lms_reset_token");
    if (!token) {
      router.replace("/forgot-password");
      return;
    }
    setResetToken(token);
    setReady(true);
  }, [router]);

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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, ...form }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        else setFormError(data.error || "Something went wrong. Please try again.");
        return;
      }

      sessionStorage.removeItem("lms_reset_token");
      sessionStorage.removeItem("lms_reset_email");
      sessionStorage.removeItem("lms_reset_method");
      router.push("/login?reset=1");
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="auth-card">
      <p className="eyebrow mb-2">Almost done</p>
      <h1 className="mb-1 font-display text-2xl font-semibold text-ink-900">
        Set a new password
      </h1>
      <p className="mb-6 text-sm text-ink-500">
        Choose a strong password you haven&apos;t used before.
      </p>

      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="New password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <FormField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
        />

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
