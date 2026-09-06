"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "TEACHER", label: "Teacher" },
];

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STUDENT",
};

export default function RegisterPage() {
  const router = useRouter();
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
      const res = await fetch("/api/auth/register", {
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

      router.push("/login?registered=1");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="eyebrow mb-2">Get started</p>
      <h1 className="mb-1 font-display text-2xl font-semibold text-ink-900">
        Create your account
      </h1>
      <p className="mb-6 text-sm text-ink-500">Join the platform as a student or teacher.</p>

      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Malaika Shabir"
          autoComplete="name"
        />

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

        <div>
          <span className="field-label">I am registering as</span>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium shadow-sm transition duration-200 ${
                  form.role === option.value
                    ? "-translate-y-0.5 border-brass-400 bg-brass-500 text-white shadow-gold"
                    : "border-ink-200 text-ink-600 hover:-translate-y-0.5 hover:border-brass-200 hover:bg-brass-50 hover:shadow-gold"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={form.role === option.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {errors.role && <p className="field-error">{errors.role}</p>}
        </div>

        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brass-600 hover:text-brass-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
