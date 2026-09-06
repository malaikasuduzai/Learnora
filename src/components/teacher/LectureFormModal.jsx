"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";

export default function LectureFormModal({ initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    videoUrl: initial?.videoUrl ?? "",
    notes: initial?.notes ?? "",
    duration: initial?.duration ?? "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

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
      await onSubmit(form);
    } catch (err) {
      setErrors(err?.fieldErrors ?? {});
      setNotice(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit lecture" : "Add a lecture"}
      description="Video, notes and duration are all optional — add what you have now and fill in the rest later."
      onClose={onClose}
      wide
    >
      {notice && <div className="alert-error">{notice}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="lec-title" className="field-label">
            Lecture title
          </label>
          <input
            id="lec-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Introduction to Python"
            className={`field-input ${errors.title ? "field-input-error" : ""}`}
            autoFocus
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="lec-desc" className="field-label">
            Description <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="lec-desc"
            name="description"
            rows={2}
            value={form.description}
            onChange={handleChange}
            placeholder="What does this lecture cover?"
            className={`field-textarea ${errors.description ? "field-input-error" : ""}`}
          />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lec-video" className="field-label">
              Video URL <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input
              id="lec-video"
              name="videoUrl"
              value={form.videoUrl}
              onChange={handleChange}
              placeholder="YouTube, Vimeo or a direct .mp4 link"
              className={`field-input ${errors.videoUrl ? "field-input-error" : ""}`}
            />
            {errors.videoUrl && <p className="field-error">{errors.videoUrl}</p>}
          </div>
          <div>
            <label htmlFor="lec-duration" className="field-label">
              Duration <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input
              id="lec-duration"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="e.g. 12 min"
              className={`field-input ${errors.duration ? "field-input-error" : ""}`}
            />
            {errors.duration && <p className="field-error">{errors.duration}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="lec-notes" className="field-label">
            Lecture notes <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="lec-notes"
            name="notes"
            rows={4}
            value={form.notes}
            onChange={handleChange}
            placeholder="Anything students should read alongside the video."
            className={`field-textarea ${errors.notes ? "field-input-error" : ""}`}
          />
          {errors.notes && <p className="field-error">{errors.notes}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost w-auto px-4">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary w-auto px-4">
            {submitting ? <Spinner className="h-4 w-4" /> : isEdit ? "Save changes" : "Add lecture"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
