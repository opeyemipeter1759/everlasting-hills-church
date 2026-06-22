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
  children: React.ReactNode;
}

function DropdownPortal({ anchorRef, open, children }: DropdownPortalProps) {
  const portalRef = useRef<HTMLDivElement>(null);

  // Set coordinates via DOM API — avoids the style={{}} JSX prop linter warning
  useEffect(() => {
    if (!open || !anchorRef.current || !portalRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    portalRef.current.style.setProperty("--dp-top", `${rect.bottom + 4}px`);
    portalRef.current.style.setProperty("--dp-left", `${rect.left}px`);
  }, [open, anchorRef]);

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
  btnRef, label, placeholder, hasValue, onOpen, onClear, disabled,
}: {
  btnRef: React.RefObject<HTMLButtonElement | null>;
  label: string | null;
  placeholder: string;
  hasValue: boolean;
  onOpen: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      ref={btnRef}
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-2 outline-none hover:border-gray-300 dark:hover:border-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      <CalendarDays size={12} className="text-gray-400 shrink-0" />
      {label ?? <span className="text-gray-400">{placeholder}</span>}
      {hasValue && (
        <span
          role="button"
          aria-label="Clear"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="ml-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <X size={10} />
        </span>
      )}
    </button>
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
        onOpen={() => setOpen((v) => !v)}
        onClear={() => { onChange(undefined); setOpen(false); }}
        disabled={disabled}
      />
      <DropdownPortal anchorRef={btnRef} open={open}>
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
        onOpen={() => setOpen((v) => !v)}
        onClear={() => { onChange(undefined); setOpen(false); }}
        disabled={disabled}
      />
      <DropdownPortal anchorRef={btnRef} open={open}>
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
