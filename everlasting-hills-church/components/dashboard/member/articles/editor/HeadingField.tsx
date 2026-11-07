"use client";

import { useEffect, useRef } from "react";

/**
 * The title or subtitle: borderless, growing with what is typed (a long title
 * wraps instead of scrolling out of sight), labelled in the left margin on
 * wide screens while focused, as Medium does, and counting characters only
 * once the limit is near. Enter moves on to the next field rather than
 * starting a line, since neither can hold one.
 */
export function HeadingField({ id, label, value, max, placeholder, onChange, onEnter, className }: {
  id: string;
  label: string;
  value: string;
  max: number;
  placeholder: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  className: string;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const nearLimit = value.length >= max * 0.8;
  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className="max-xl:sr-only absolute -left-28 top-2 w-20 border-r border-[var(--m-line)] pr-3 text-right font-sans text-[13px] text-[var(--m-gray)] opacity-0 transition-opacity group-focus-within:opacity-100"
      >
        {label}
      </label>
      <textarea
        id={id}
        ref={box}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\s*\n\s*/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        maxLength={max}
        className={`block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-[var(--m-gray)] placeholder:opacity-50 focus:ring-0 ${className}`}
      />
      {nearLimit && (
        <span
          aria-live="polite"
          className={`absolute -bottom-5 right-0 font-sans text-[11px] tabular-nums opacity-0 transition-opacity group-focus-within:opacity-100 ${
            value.length >= max ? "text-[var(--m-brand)]" : "text-[var(--m-gray)]"
          }`}
        >
          {value.length}/{max}
        </span>
      )}
    </div>
  );
}
