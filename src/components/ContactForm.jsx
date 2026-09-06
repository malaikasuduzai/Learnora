"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

const INITIAL_FORM = { name: "", email: "", subject: "", message: "" };

// The landing page's "Talk to our team" form. Previously a static div
// (see the comment this replaced in page.js) since page.js is a server
// component; this is its own small client component so the rest of the
// landing page can stay a server component. Submits to POST /api/contact,
// which an Admin then manages from the Contact Messages page.
export default function ContactForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          body: form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          // The API's field is "body"; the form's field is "message".
          const { body, ...rest } = data.fieldErrors;
          setErrors(body ? { ...rest, message: body } : rest);
        } else {
          setFormError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }
      setForm(INITIAL_FORM);
      setSent(true);
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="card flex flex-col items-center justify-center gap-2 p-7 text-center lg:col-span-3">
        <p className="font-display text-lg font-semibold text-ink-900">Message sent</p>
        <p className="max-w-sm text-sm text-ink-500">
          Thanks for reaching out — we typically reply within one business day.
        </p>
        <button type="button" onClick={() => setSent(false)} className="btn-secondary mt-3 w-auto px-4">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-7 lg:col-span-3">
      {formError && <div className="alert-error">{formError}</div>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">
            Full name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            className={`field-input ${errors.name ? "field-input-error" : ""}`}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className="field-label">
            Email address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`field-input ${errors.email ? "field-input-error" : ""}`}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
      </div>
      <div className="mt-5">
        <label htmlFor="contact-subject" className="field-label">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          value={form.subject}
          onChange={handleChange}
          placeholder="How can we help?"
          className={`field-input ${errors.subject ? "field-input-error" : ""}`}
        />
        {errors.subject && <p className="field-error">{errors.subject}</p>}
      </div>
      <div className="mt-5">
        <label htmlFor="contact-message" className="field-label">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          placeholder="Tell us a bit more..."
          className={`field-textarea ${errors.message ? "field-input-error" : ""}`}
        />
        {errors.message && <p className="field-error">{errors.message}</p>}
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="submit"
          disabled={submitting}
          className="btn-brass w-full max-w-xs transition duration-200 hover:scale-[1.02] sm:w-auto sm:px-10"
        >
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
