"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const PLACEHOLDER = "Tell your story…\n\n## A heading\n\nSome **bold** and *italic* words.\n\n- A list item";

/** The story as plain Markdown, in a box that grows with it. */
export const MarkdownSource = forwardRef<HTMLTextAreaElement, {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}>(function MarkdownSource({ value, maxLength, onChange }, ref) {
  const box = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => box.current!, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(360, el.scrollHeight)}px`;
  }, [value]);

  return (
    <div className="m-paper mt-6 rounded-xl border m-rule">
      <label htmlFor="article-body" className="sr-only">
        Your story
      </label>
      <textarea
        id="article-body"
        ref={box}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        maxLength={maxLength}
        spellCheck
        className="block w-full resize-none overflow-hidden rounded-xl border-0 bg-transparent px-5 py-4 font-mono text-[14px] leading-7 text-[var(--m-ink)] outline-none placeholder:text-[var(--m-gray)] placeholder:opacity-60 focus:ring-0"
      />
    </div>
  );
});
