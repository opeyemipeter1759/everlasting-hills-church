import type { PublicSlot } from "@/lib/api/prayer-watch";
import { WATCH_COLORS, serif } from "./sky";

/** The watch hours themselves are the picker — no separate dropdown duplicating the same choice. */
export function WatchHourPicker({ slots, value, onChange, disabled }: { slots: PublicSlot[]; value: string; onChange: (id: string) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Prayer watch hour" className="grid gap-3 xs:grid-cols-2">
      {slots.map((s, i) => {
        const full = s.spotsLeft <= 0;
        const filled = Math.min(1, Math.max(0, (s.capacity - s.spotsLeft) / s.capacity));
        const selected = s.id === value;
        const c = WATCH_COLORS[i % WATCH_COLORS.length];
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={full || disabled}
            onClick={() => onChange(s.id)}
            style={full ? undefined : { background: c.bg, color: c.text }}
            className={`flex min-h-[112px] flex-col justify-between rounded-2xl p-4 text-left transition-all ${
              full
                ? "cursor-not-allowed border border-dashed border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.02]"
                : selected
                  ? "ring-2 ring-[#E7B454] ring-offset-2 ring-offset-white dark:ring-offset-[#0b0712]"
                  : "opacity-[0.92] hover:opacity-100"
            }`}
          >
            <span style={serif} className={`block text-xl font-medium tabular-nums sm:text-2xl ${full ? "text-gray-400 dark:text-white/30" : ""}`}>
              {s.startTime}
              <span className="mx-1 opacity-50">–</span>
              {s.endTime}
            </span>
            <span>
              <span className="block text-xs font-semibold" style={full ? undefined : { color: c.sub }}>
                {s.label}
                {full && <span className="text-gray-400 dark:text-white/40"> · Full</span>}
              </span>
              {!full && (
                <span className="mt-2 block h-1 overflow-hidden rounded-full" style={{ background: c.bar }}>
                  <span className="block h-full rounded-full bg-white/80" style={{ width: `${filled * 100}%` }} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
