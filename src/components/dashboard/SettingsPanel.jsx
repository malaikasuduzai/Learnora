"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import FormField from "@/components/FormField";
import NotificationsManager from "@/components/dashboard/NotificationsManager";
import { UserIcon, LockIcon } from "@/components/icons";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProfileForm({ user }) {
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    bio: user.bio || "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (successMessage) setSuccessMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        else setFormError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccessMessage("Profile updated.");
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6 transition duration-200 hover:border-brass-200 hover:shadow-gold">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-50 text-brass-600">
          <UserIcon className="h-4 w-4" />
        </span>
        <p className="font-display text-base font-semibold text-ink-900">Profile information</p>
      </div>
      <p className="mt-1.5 text-sm text-ink-500">
        This is what your teachers, students and admins see about you.
      </p>

      <div className="mt-6 flex items-center gap-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink-900 text-lg font-semibold text-white ring-4 ring-white shadow-sm">{initials(user.name)}</span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-900">{user.name}</p><p className="truncate text-xs text-ink-400">{user.email}</p><div className="mt-2 flex flex-wrap gap-2"><span className="badge bg-brass-50 text-brass-700">{user.role.replace("_", " ")}</span><span className="badge bg-emerald-50 text-emerald-700">{user.isActive ? "Active" : "Inactive"}</span></div></div>
      </div>

      {formError && <div className="alert-error mt-5 mb-0">{formError}</div>}
      {successMessage && <div className="alert-success mt-5 mb-0">{successMessage}</div>}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <FormField
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Your full name"
          autoComplete="name"
        />

        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="field-input cursor-not-allowed bg-ink-50 text-ink-400"
          />
          <p className="mt-1.5 text-xs text-ink-400">Email is your login and can&apos;t be changed here.</p>
        </div>

        <FormField
          label="Phone number"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="Used for SMS password reset codes"
          autoComplete="tel"
        />

        <div>
          <label htmlFor="bio" className="field-label">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={form.bio}
            onChange={handleChange}
            placeholder="A short line about yourself"
            className="field-textarea"
          />
          {errors.bio && <p className="field-error">{errors.bio}</p>}
        </div>

        <div className="flex justify-center">
          <button type="submit" className="btn-primary w-auto px-6" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (successMessage) setSuccessMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/user/change-password", {
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

      setSuccessMessage("Password updated.");
      setForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6 transition duration-200 hover:border-brass-200 hover:shadow-gold">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-50 text-brass-600">
          <LockIcon className="h-4 w-4" />
        </span>
        <p className="font-display text-base font-semibold text-ink-900">Change password</p>
      </div>
      <p className="mt-1.5 text-sm text-ink-500">
        Use a password you don&apos;t use anywhere else.
      </p>

      {formError && <div className="alert-error mt-5 mb-0">{formError}</div>}
      {successMessage && <div className="alert-success mt-5 mb-0">{successMessage}</div>}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <FormField
          label="Current password"
          name="currentPassword"
          type="password"
          value={form.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          placeholder="Your current password"
          autoComplete="current-password"
        />
        <FormField
          label="New password"
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <FormField
          label="Confirm new password"
          name="confirmNewPassword"
          type="password"
          value={form.confirmNewPassword}
          onChange={handleChange}
          error={errors.confirmNewPassword}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
        />

        <div className="flex justify-center">
          <button type="submit" className="btn-primary w-auto px-6" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPanel({ user }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ProfileForm user={user} />
        <PasswordForm />
        <NotificationsManager />
      </div>
    </div>
  );
}
