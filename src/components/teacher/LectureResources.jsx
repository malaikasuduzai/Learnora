"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import { FileIcon, LinkIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { RESOURCE_TYPES } from "@/lib/courseContent";

export default function LectureResources({ lectureId, resources, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", type: "LINK" });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    setNotice("");
    try {
      await onAdd(lectureId, form);
      setForm({ title: "", url: "", type: "LINK" });
      setShowForm(false);
    } catch (err) {
      setNotice(err?.message ?? "Couldn't add that resource.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(resourceId, title) {
    if (!window.confirm(`Remove the resource "${title}"?`)) return;
    setDeletingId(resourceId);
    setNotice("");
    try {
      await onDelete(lectureId, resourceId);
    } catch (err) {
      setNotice(err?.message ?? "Couldn't remove that resource.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-lg bg-ink-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Resources
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-ghost px-2 py-1 text-xs text-brass-600 hover:bg-brass-50 hover:text-brass-700"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {notice && <p className="field-error mt-1.5">{notice}</p>}

      {resources.length === 0 && !showForm && (
        <p className="mt-1.5 text-xs text-ink-400">No resources added yet.</p>
      )}

      {resources.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5"
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-700 hover:underline"
              >
                {resource.type === "LINK" ? (
                  <LinkIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                ) : (
                  <FileIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                )}
                <span className="truncate">{resource.title}</span>
              </a>
              <button
                type="button"
                onClick={() => handleDelete(resource.id, resource.title)}
                disabled={deletingId === resource.id}
                className="btn-ghost shrink-0 px-1.5 py-1 text-red-500 hover:bg-red-50"
                aria-label={`Remove ${resource.title}`}
              >
                {deletingId === resource.id ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <TrashIcon className="h-3.5 w-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mt-2.5 space-y-2 border-t border-ink-100 pt-2.5">
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Resource title"
            className="field-input py-1.5 text-xs"
            required
          />
          <div className="flex gap-2">
            <input
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://…"
              className="field-input py-1.5 text-xs"
              required
            />
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="field-input w-auto py-1.5 text-xs"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-ghost px-3 py-1 text-xs"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary w-auto px-3 py-1 text-xs">
              {submitting ? <Spinner className="h-3.5 w-3.5" /> : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
