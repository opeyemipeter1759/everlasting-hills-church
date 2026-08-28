import { CalendarDays, X } from "lucide-react";

const FIELD =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-[#87102C]/40 focus:outline-none focus:ring-2 focus:ring-[#87102C]/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:[color-scheme:dark]";

/**
 * Filters the first-timer list to submissions between two dates, inclusive.
 *
 * Native date inputs rather than a custom picker: this is used on a phone in the
 * foyer as often as on a desktop, and the OS picker is the one people already
 * know. Either bound can stand alone — "everything since Sunday" is the common
 * case and needs only a start date.
 */
export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}) {
  const active = Boolean(from || to);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <CalendarDays
        size={14}
        className="text-gray-400 dark:text-white/35"
        aria-hidden="true"
      />
      <input
        type="date"
        aria-label="Submitted from"
        value={from}
        max={to || undefined}
        onChange={(event) => onFromChange(event.target.value)}
        className={FIELD}
      />
      <span className="text-xs text-gray-400 dark:text-white/30">to</span>
      <input
        type="date"
        aria-label="Submitted to"
        value={to}
        min={from || undefined}
        onChange={(event) => onToChange(event.target.value)}
        className={FIELD}
      />
      {active && (
        <button
          type="button"
          onClick={onClear}
          title="Clear dates"
          aria-label="Clear date filter"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
