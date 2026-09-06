"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";

export default function ModuleFormModal({ initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setNotice("");
    try {
      await onSubmit({ title, description });
    } catch (err) {
      setErrors(err?.fieldErrors ?? {});
      setNotice(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit module" : "Add a module"}
      description="Modules group related lectures together, e.g. “Module 01 — Getting started”."
      onClose={onClose}
    >
      {notice && <div className="alert-error">{notice}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="mod-title" className="field-label">
            Module title
          </label>
          <input
            id="mod-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Module 01 — Introduction"
            className={`field-input ${errors.title ? "field-input-error" : ""}`}
            autoFocus
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="mod-desc" className="field-label">
            Description <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="mod-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this module cover?"
            className={`field-textarea ${errors.description ? "field-input-error" : ""}`}
          />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost w-auto px-4">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary w-auto px-4">
            {submitting ? <Spinner className="h-4 w-4" /> : isEdit ? "Save changes" : "Add module"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
