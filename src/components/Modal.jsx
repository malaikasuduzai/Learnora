"use client";

import { useEffect } from "react";
import { XIcon } from "@/components/icons";

export default function Modal({ title, description, onClose, children, wide = false }) {
  // Lock the underlying page while the modal is open. Without this, the
  // body behind the modal stays scrollable, so on touch devices scrolling
  // to the bottom (or top) of the modal's own scroll area "chains" into
  // the hidden body scroll instead of stopping — which is what made long
  // forms (e.g. Create task) feel like they got stuck and wouldn't scroll
  // back up. Locking body scroll for the lifetime of the modal, and
  // restoring the exact previous value on unmount, fixes that.
  useEffect(() => {
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = previousOverflow;
    };
  }, []);

  // Let people dismiss a form with Escape, same as clicking the backdrop
  // or the close button — expected keyboard behavior for any dialog.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Close dialog"
        className="fixed inset-0 bg-ink-950/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative flex max-h-[calc(100vh-2rem)] w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel`}
      >
        {/* Sticky header: stays visible regardless of how tall the form body is,
            so the title/description/close button never scroll out of view. */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-100 px-6 py-5 sm:px-7">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost -mr-1.5 -mt-1 shrink-0 px-2"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {/* Scrollable body: only this region scrolls, independent of the header. */}
        <div className="overflow-y-auto overscroll-contain px-6 py-5 sm:px-7">{children}</div>
      </div>
    </div>
  );
}
