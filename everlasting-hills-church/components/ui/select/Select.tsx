"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown (muted) when `value` matches no option, i.e. the empty/"Any" state. */
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  /** Applied to the trigger button — pass the same box classes the old <select> used. */
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * Branded single-select, a drop-in for a native <select>.
 *
 * Why a custom control: the native <select> popup is OS-rendered (white, un-themable)
 * and looks broken on the dark UI. This renders its own listbox styled to the brand.
 *
 * The listbox is portalled to <body> with fixed positioning so it is never clipped by
 * an ancestor's overflow (these live inside modals, drawers and filter panels) and
 * flips above the trigger when there is no room below — matching what native does.
 *
 * Focus stays on the trigger; arrow keys, Home/End, Enter/Space, Escape and type-ahead
 * are handled there, so there is no focus-trap to manage.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  id,
  name,
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef<{ buffer: string; at: number }>({ buffer: "", at: 0 });
  const listboxId = useId();

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const selectableIndexes = useMemo(
    () => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0),
    [options],
  );

  // Portal target is only available after mount (SSR-safe).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Fixed-position rect for the panel, recomputed on open and on any scroll/resize so
  // the panel tracks the trigger instead of detaching.
  const [rect, setRect] = useState<{ top: number; left: number; width: number; below: number } | null>(null);
  const measure = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom, left: r.left, width: r.width, below: window.innerHeight - r.bottom });
  };

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onScrollOrResize = () => measure();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  // Dismiss on outside pointer-down (trigger and panel both excluded).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // When opening, highlight the current value (or the first selectable option).
  useEffect(() => {
    if (!open) return;
    const cur = options.findIndex((o) => o.value === value && !o.disabled);
    setHighlight(cur >= 0 ? cur : (selectableIndexes[0] ?? -1));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open || highlight < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  function commit(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveHighlight(delta: number) {
    if (selectableIndexes.length === 0) return;
    const pos = selectableIndexes.indexOf(highlight);
    const next =
      pos === -1
        ? selectableIndexes[delta > 0 ? 0 : selectableIndexes.length - 1]
        : selectableIndexes[(pos + delta + selectableIndexes.length) % selectableIndexes.length];
    setHighlight(next);
  }

  function onTypeahead(char: string) {
    const now = Date.now();
    const t = typeahead.current;
    t.buffer = now - t.at > 600 ? char : t.buffer + char;
    t.at = now;
    const match = options.findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(t.buffer.toLowerCase()),
    );
    if (match >= 0) {
      if (open) setHighlight(match);
      else commit(match);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        else moveHighlight(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        else moveHighlight(-1);
        break;
      case "Home":
        if (open) { e.preventDefault(); setHighlight(selectableIndexes[0] ?? -1); }
        break;
      case "End":
        if (open) { e.preventDefault(); setHighlight(selectableIndexes[selectableIndexes.length - 1] ?? -1); }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) setOpen(true);
        else if (highlight >= 0) commit(highlight);
        break;
      case "Escape":
        if (open) { e.preventDefault(); setOpen(false); }
        break;
      case "Tab":
        if (open) setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) onTypeahead(e.key);
    }
  }

  const openUp = rect ? rect.below < 260 : false;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        id={id}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={[
          "flex items-center justify-between gap-2 text-left",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className,
        ].join(" ")}
      >
        <span className={selected ? "truncate" : "truncate text-[#8a7e80] dark:text-white/40"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={[
            "flex-shrink-0 text-[#8a7e80] transition-transform duration-150 dark:text-white/40",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Hidden field so this participates in native form submission if wrapped in a form. */}
      {name && <input type="hidden" name={name} value={value} />}

      {mounted && open && rect &&
        createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-activedescendant={highlight >= 0 ? `${listboxId}-opt-${highlight}` : undefined}
            style={{
              position: "fixed",
              left: rect.left,
              width: rect.width,
              ...(openUp ? { bottom: window.innerHeight - rect.top + rect.below + 4 } : { top: rect.top + 4 }),
            }}
            className="z-[60] max-h-60 overflow-y-auto rounded-xl border border-[#E7CDD3]/70 bg-white p-1 shadow-lg shadow-black/[0.08] dark:border-white/[0.1] dark:bg-[#1c1c1e] dark:shadow-black/40"
          >
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-[#8a7e80] dark:text-white/40">No options</li>
            )}
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlight;
              return (
                <li
                  key={`${opt.value}-${i}`}
                  id={`${listboxId}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => !opt.disabled && setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(i)}
                  className={[
                    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    opt.disabled
                      ? "cursor-not-allowed text-[#8a7e80]/50 dark:text-white/25"
                      : "cursor-pointer text-[#111] dark:text-white/80",
                    isHighlighted && !opt.disabled ? "bg-[#FFF4F6] dark:bg-white/[0.06]" : "",
                    isSelected ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {isSelected && (
                    <Check size={15} aria-hidden="true" className="flex-shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
                  )}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
