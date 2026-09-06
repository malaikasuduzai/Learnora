"use client";

import { useEffect, useState, useCallback } from "react";
import Spinner from "@/components/Spinner";
import FormField from "@/components/FormField";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { SearchIcon, UsersIcon, PlusIcon } from "@/components/icons";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AddTeacherModal({ onClose, onCreated }) {
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
      const res = await fetch("/api/admin/teachers", {
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
      onCreated(data.teacher);
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add teacher" description="Create a Teacher account they can log in with right away." onClose={onClose}>
      {formError && <div className="alert-error">{formError}</div>}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Muhammad Ali" autoComplete="off" />
        <FormField label="Email address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="teacher@example.com" autoComplete="off" />
        <FormField label="Temporary password" name="password" type="text" value={form.password} onChange={handleChange} error={errors.password} placeholder="At least 8 characters, incl. upper/lowercase & a number" autoComplete="off" />
        <FormField label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="03xx xxxxxxx" autoComplete="off" />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary w-auto px-4">Cancel</button>
          <button type="submit" className="btn-primary w-auto px-4" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            {submitting ? "Creating..." : "Create teacher"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditTeacherModal({ teacher, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: teacher.name || "",
    phone: teacher.phone || "",
    bio: teacher.bio || "",
    isActive: teacher.isActive,
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
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
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
      onSaved(data.teacher);
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Edit teacher" description={teacher.email} onClose={onClose}>
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
            <span className="block text-xs text-ink-400">Deactivating blocks this teacher from logging in.</span>
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

export default function TeachersManager() {
  const [teachers, setTeachers] = useState(null);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async (searchTerm) => {
    setLoadError("");
    try {
      const url = searchTerm ? `/api/admin/teachers?search=${encodeURIComponent(searchTerm)}` : "/api/admin/teachers";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Could not load teachers.");
        return;
      }
      setTeachers(data.teachers);
    } catch {
      setLoadError("Could not reach the server.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 250);
    return () => clearTimeout(timer);
  }, [search, load]);

  function handleCreated(teacher) {
    setShowAdd(false);
    setTeachers((prev) => [teacher, ...(prev || [])]);
  }

  function handleSaved(teacher) {
    setEditing(null);
    setTeachers((prev) => (prev || []).map((t) => (t.id === teacher.id ? { ...t, ...teacher } : t)));
  }

  async function toggleActive(teacher) {
    const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !teacher.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setTeachers((prev) => (prev || []).map((t) => (t.id === teacher.id ? { ...t, ...data.teacher } : t)));
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
            placeholder="Search teachers by name or email…"
            className="field-input pl-9"
          />
        </div>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-brass w-auto px-4">
          <PlusIcon className="h-4 w-4" />
          Add teacher
        </button>
      </div>

      {loadError && <div className="alert-error mb-0">{loadError}</div>}

      <div className="card overflow-hidden">
        {teachers === null ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-400">
            <Spinner className="h-4 w-4" /> Loading teachers…
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <UsersIcon className="h-8 w-8 text-ink-300" />
            <p className="text-sm font-medium text-ink-600">No teachers yet</p>
            <p className="max-w-xs text-xs text-ink-400">Add a teacher account so you can assign them to courses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">Teacher</th>
                  <th className="px-5 py-3 font-medium">Courses</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="transition-colors hover:bg-role-adminSoft/50">
                    <td className="border-l-4 border-l-role-admin px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-teacherSoft text-xs font-semibold text-role-teacher">
                          {initials(teacher.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-900">{teacher.name}</p>
                          <p className="truncate text-xs text-ink-400">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">{teacher._count?.coursesTaught ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={teacher.isActive ? "YES" : "NO"} label={teacher.isActive ? "Active" : "Deactivated"} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setEditing(teacher)} className="btn-chip">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(teacher)}
                          className={teacher.isActive ? "btn-chip-danger" : "btn-chip"}
                        >
                          {teacher.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddTeacherModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
      {editing && <EditTeacherModal teacher={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  );
}
