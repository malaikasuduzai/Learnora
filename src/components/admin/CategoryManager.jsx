"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";
import { PencilIcon, PlusIcon, LayersIcon, TrashIcon, XCircleIcon } from "@/components/icons";

const EMPTY_FORM = { name: "", description: "" };

export default function CategoryManager({ categories }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setNotice("");
    setShowForm(true);
  }

  function openEdit(category) {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description ?? "" });
    setErrors({});
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setNotice("");

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setNotice(data.error && !data.fieldErrors ? data.error : "");
        return;
      }

      closeForm();
      router.refresh();
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    setDeletingId(category.id);
    setNotice("");

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Couldn't delete this category.");
        return;
      }
      router.refresh();
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="h-4.5 w-4.5 text-ink-400" />
          <h2 className="font-display text-base font-semibold text-ink-900">Course categories</h2>
        </div>
        {!showForm && (
          <button type="button" onClick={openCreate} className="btn-brass w-auto px-3 py-1.5 text-xs">
            <PlusIcon className="h-4 w-4" />
            New category
          </button>
        )}
      </div>

      {notice && <p className="mt-3 text-xs font-medium text-red-600">{notice}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
          <FormField
            label="Category name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Web Development"
          />
          <div>
            <label htmlFor="description" className="field-label">
              Description <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="What kind of courses live in this category?"
              className={`field-textarea ${errors.description ? "field-input-error" : ""}`}
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={submitting} className="btn-primary w-auto px-4">
              {submitting ? <Spinner className="h-4 w-4" /> : editingId ? "Save changes" : "Add category"}
            </button>
            <button type="button" onClick={closeForm} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className="mt-4 space-y-1.5">
        {categories.length === 0 && !showForm && (
          <li className="rounded-lg border border-dashed border-ink-200 px-3.5 py-4 text-center text-sm text-ink-400">
            No categories yet. Add one to start creating courses.
          </li>
        )}
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-l-role-admin px-3 py-2.5 transition-colors hover:bg-role-adminSoft/50"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-role-adminSoft text-role-admin">
                <LayersIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-800">{category.name}</p>
                <p className="text-xs text-ink-400">
                  {category._count?.courses ?? 0} course{(category._count?.courses ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => openEdit(category)}
                className="btn-ghost px-2 py-1.5"
                aria-label={`Edit ${category.name}`}
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(category)}
                disabled={deletingId === category.id}
                className="btn-ghost px-2 py-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${category.name}`}
              >
                {deletingId === category.id ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
