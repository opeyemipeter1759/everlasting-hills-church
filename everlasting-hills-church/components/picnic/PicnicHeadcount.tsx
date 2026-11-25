"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CaretDown, Check, Icon } from "@/components/icons";

const OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);
const labelFor = (n: number) => (n === 1 ? "Just me" : n === 10 ? "10 or more" : `${n} people`);

/**
 * "How many of you are coming?" — a styled listbox in place of the browser's
 * native select. Keyboard: ↑/↓ move, Enter/Space choose, Esc closes; click
 * outside closes. ARIA listbox pattern so screen readers announce it properly.
 */
export default function PicnicHeadcount({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    setActive(value);
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, value]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-n="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function choose(n: number) {
    onChange(n);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => Math.min(10, Math.max(1, a + (e.key === "ArrowDown" ? 1 : -1))));
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`${className} flex items-center justify-between text-left`}
      >
        <span>{labelFor(value)}</span>
        <Icon icon={CaretDown} size={16} className={`text-[#F7F0E3]/70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-auto rounded-2xl border border-[#1B1714]/10 bg-[#FBF6EE] p-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)]"
        >
          {OPTIONS.map((n) => {
            const selected = n === value;
            const highlighted = n === active;
            return (
              <li
                key={n}
                id={`${listId}-${n}`}
                data-n={n}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(n)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(n)}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] transition-colors ${
                  highlighted ? "bg-[#1E3A2A] text-[#F7F0E3]" : "text-[#1B1714]"
                } ${selected && !highlighted ? "font-semibold" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      highlighted ? "bg-[#F7F0E3] text-[#1E3A2A]" : "bg-[#1B1714]/[0.06] text-[#1B1714]/70"
                    }`}
                  >
                    {n === 10 ? "10+" : n}
                  </span>
                  {labelFor(n)}
                </span>
                {selected && <Icon icon={Check} size={16} weight="bold" className={highlighted ? "text-[#F7F0E3]" : "text-[#87102C]"} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
