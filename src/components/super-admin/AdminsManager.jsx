"use client";

import { useEffect, useState, useCallback } from "react";
import Spinner from "@/components/Spinner";
import FormField from "@/components/FormField";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { SearchIcon, ShieldIcon, PlusIcon } from "@/components/icons";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AddAdminModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
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
      const res = await fetch("/api/super-admin/admins", {
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
      onCreated(data.admin);
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Create admin" description="Give someone Admin access to manage academic operations." onClose={onClose}>
      {formError && <div className="alert-error">{formError}</div>}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Ayesha Khan" autoComplete="off" />
        <FormField label="Email address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="admin@example.com" autoComplete="off" />
        <FormField label="Temporary password" name="password" type="text" value={form.password} onChange={handleChange} error={errors.password} placeholder="At least 8 characters, incl. upper/lowercase & a number" autoComplete="off" />
        <FormField label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="03xx xxxxxxx" autoComplete="off" />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary w-auto px-4">Cancel</button>
          <button type="submit" className="btn-primary w-auto px-4" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? "Creating..." : "Create admin"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditAdminModal({ admin, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: admin.name || "",
    phone: admin.phone || "",
    bio: admin.bio || "",
    isActive: admin.isActive,
  });
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
      const res = await fetch(`/api/super-admin/admins/${admin.id}`, {
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
      onSaved(data.admin);
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Edit admin" description={admin.email} onClose={onClose}>
      {formError && <div className="alert-error">{formError}</div>}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} autoComplete="off" />
        <FormField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="off" />
        <div>
          <label htmlFor="bio" className="field-label">Bio</label>
          <textarea id="bio" name="bio" rows={3} value={form.bio} onChange={handleChange} className="field-textarea" />
          {errors.bio && <p className="field-error">{errors.bio}</p>}
        </div>
        <label className="flex items-center gap-2.5 rounded-lg border border-ink-100 bg-ink-50 px-3.5 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-400"
          />
          <span>
            <span className="font-medium text-ink-800">Account active</span>
            <span className="block text-xs text-ink-400">Deactivating blocks this admin from logging in.</span>
          </span>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary w-auto px-4">Cancel</button>
          <button type="submit" className="btn-primary w-auto px-4" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminsManager({ currentUserId }) {
  const [admins, setAdmins] = useState(null);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async (searchTerm) => {
    setLoadError("");
    try {
      const url = searchTerm ? `/api/super-admin/admins?search=${encodeURIComponent(searchTerm)}` : "/api/super-admin/admins";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Could not load admins.");
        return;
      }
      setAdmins(data.admins);
    } catch {
      setLoadError("Could not reach the server.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 250);
    return () => clearTimeout(timer);
  }, [search, load]);

  function handleCreated(admin) {
    setShowAdd(false);
    setAdmins((prev) => [admin, ...(prev || [])]);
  }

  function handleSaved(admin) {
    setEditing(null);
    setAdmins((prev) => (prev || []).map((a) => (a.id === admin.id ? { ...a, ...admin } : a)));
  }

  async function toggleActive(admin) {
    const res = await fetch(`/api/super-admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !admin.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setAdmins((prev) => (prev || []).map((a) => (a.id === admin.id ? { ...a, ...data.admin } : a)));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admins by name or email…"
            className="field-input pl-9"
          />
        </div>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-brass w-auto px-4">
          <PlusIcon className="h-4 w-4" />
          Create admin
        </button>
      </div>

      {loadError && <div className="alert-error mb-0">{loadError}</div>}

      <div className="card overflow-hidden">
        {admins === null ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-400">
            <Spinner className="h-4 w-4" /> Loading admins…
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <ShieldIcon className="h-8 w-8 text-ink-300" />
            <p className="text-sm font-medium text-ink-600">No admins yet</p>
            <p className="max-w-xs text-xs text-ink-400">Create an Admin account to hand off day-to-day academic operations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">Admin</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {admins.map((admin) => {
                  const isSelf = admin.id === currentUserId;
                  return (
                    <tr key={admin.id} className="transition-colors hover:bg-role-superadminSoft/50">
                      <td className="border-l-4 border-l-role-superadmin px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-adminSoft text-xs font-semibold text-role-admin">
                            {initials(admin.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink-900">
                              {admin.name}
                              {isSelf && <span className="ml-1.5 text-xs font-normal text-ink-400">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-ink-400">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={admin.isActive ? "YES" : "NO"} label={admin.isActive ? "Active" : "Deactivated"} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => setEditing(admin)} className="btn-chip">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(admin)}
                            disabled={isSelf}
                            title={isSelf ? "You can't deactivate your own account" : undefined}
                            className={`${admin.isActive ? "btn-chip-danger" : "btn-chip"} disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            {admin.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {editing && <EditAdminModal admin={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  );
}
