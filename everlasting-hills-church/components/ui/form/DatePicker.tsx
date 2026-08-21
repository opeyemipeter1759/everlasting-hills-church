"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker, type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import "react-day-picker/style.css";

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
  .rdp-root {
    --rdp-accent-color: #87102C;
    --rdp-accent-background-color: rgba(135,16,44,0.08);
    --rdp-day-width: 32px;
    --rdp-day-height: 32px;
    font-size: 0.75rem;
  }
  .rdp-month_caption { font-size: 0.8rem; font-weight: 700; padding-bottom: 4px; }
  .rdp-weekday { font-size: 0.65rem; font-weight: 600; color: #9ca3af; }
  .rdp-day_button { width: 32px; height: 32px; border-radius: 8px; font-size: 0.75rem; }
  .rdp-day_button:hover:not([disabled]) { background: rgba(135,16,44,0.08); }
  .rdp-selected .rdp-day_button { background: #87102C !important; color: #fff !important; }
  .rdp-range_start .rdp-day_button,
  .rdp-range_end   .rdp-day_button { background: #87102C !important; color: #fff !important; border-radius: 8px; }
  .rdp-range_middle .rdp-day_button { background: rgba(135,16,44,0.08) !important; border-radius: 0; }
  .rdp-today:not(.rdp-selected) .rdp-day_button { color: #87102C; font-weight: 700; }
  .rdp-nav button { width: 26px; height: 26px; border-radius: 6px; }
  .rdp-nav button:hover { background: rgba(0,0,0,0.06); }

  /* Portal root — coordinates set via CSS custom properties on the element */
  .dp-portal {
    position: fixed;
    top: var(--dp-top, 0px);
    left: var(--dp-left, 0px);
    z-index: 9999;
  }
`;

// ── Portal dropdown — fixed position escapes any overflow:hidden parent ───────
interface DropdownPortalProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function DropdownPortal({ anchorRef, open, onClose, children }: DropdownPortalProps) {
  const portalRef = useRef<HTMLDivElement>(null);

  // Set coordinates via DOM API — avoids the style={{}} JSX prop linter warning
  useEffect(() => {
    if (!open || !anchorRef.current || !portalRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    portalRef.current.style.setProperty("--dp-top", `${rect.bottom + 4}px`);
    portalRef.current.style.setProperty("--dp-left", `${rect.left}px`);
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      anchorRef.current?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div ref={portalRef} className="dp-portal">
      {children}
    </div>,
    document.body,
  );
}

// ── Trigger button ────────────────────────────────────────────────────────────
function TriggerButton({
  btnRef, label, placeholder, hasValue, open, onOpen, onClear, disabled,
}: {
  btnRef: React.RefObject<HTMLButtonElement>;
  label: string | null;
  placeholder: string;
  hasValue: boolean;
  open: boolean;
  onOpen: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex items-stretch whitespace-nowrap">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-700 outline-none transition-colors hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-[#87102C]/25 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 ${
          hasValue ? "rounded-l-lg" : "rounded-lg"
        }`}
      >
        <CalendarDays size={12} aria-hidden="true" className="text-gray-400 shrink-0" />
        {label ?? <span className="text-gray-400">{placeholder}</span>}
      </button>
      {hasValue && (
        <button
          type="button"
          disabled={disabled}
          aria-label={`Clear ${placeholder.toLowerCase()}`}
          onClick={onClear}
          className="rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-2 text-gray-400 outline-none transition-colors hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-[#87102C]/25 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:hover:text-white"
        >
          <X size={10} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e22] shadow-2xl p-2">
      {children}
    </div>
  );
}

// ── Shared click-outside hook ─────────────────────────────────────────────────
function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    function onMouseDown(e: MouseEvent) {
      if (refs.some((r) => r.current?.contains(e.target as Node))) return;
      handler();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [refs, handler, enabled]);
}

// ── Single date picker ────────────────────────────────────────────────────────
interface SingleDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SingleDatePicker({ value, onChange, placeholder = "Pick a date", disabled }: SingleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside([btnRef, panelRef], () => setOpen(false), open);

  return (
    <>
      <style>{CSS}</style>
      <TriggerButton
        btnRef={btnRef}
        label={value ? format(value, "dd MMM yyyy") : null}
        placeholder={placeholder}
        hasValue={!!value}
        open={open}
        onOpen={() => setOpen((v) => !v)}
        onClear={() => { onChange(undefined); setOpen(false); }}
        disabled={disabled}
      />
      <DropdownPortal anchorRef={btnRef} open={open} onClose={() => setOpen(false)}>
        <div ref={panelRef}>
          <Panel>
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(d) => { onChange(d); setOpen(false); }}
              showOutsideDays
            />
          </Panel>
        </div>
      </DropdownPortal>
    </>
  );
}

// ── Range date picker ─────────────────────────────────────────────────────────
interface RangeDatePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RangeDatePicker({ value, onChange, placeholder = "Pick a range", disabled }: RangeDatePickerProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside([btnRef, panelRef], () => setOpen(false), open);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "dd MMM")} – ${format(value.to, "dd MMM yyyy")}`
      : format(value.from, "dd MMM yyyy")
    : null;

  return (
    <>
      <style>{CSS}</style>
      <TriggerButton
        btnRef={btnRef}
        label={label}
        placeholder={placeholder}
        hasValue={!!value?.from}
        open={open}
        onOpen={() => setOpen((v) => !v)}
        onClear={() => { onChange(undefined); setOpen(false); }}
        disabled={disabled}
      />
      <DropdownPortal anchorRef={btnRef} open={open} onClose={() => setOpen(false)}>
        <div ref={panelRef}>
          <Panel>
            <DayPicker
              mode="range"
              selected={value}
              onSelect={onChange}
              showOutsideDays
              numberOfMonths={2}
            />
            {value?.from && value?.to && (
              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-white/8 mt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#87102C] text-white font-semibold hover:bg-[#6E0C24] transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </Panel>
        </div>
      </DropdownPortal>
    </>
  );
}

export type { DateRange };
