"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  rightElement,
}) {
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="field-label">
          {label}
        </label>
        {rightElement}
      </div>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && revealed ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`field-input ${isPassword ? "pr-10" : ""} ${error ? "field-input-error" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            tabIndex={-1}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-300 transition hover:text-ink-600"
          >
            {revealed ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
