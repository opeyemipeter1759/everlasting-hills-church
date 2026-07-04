"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Check, Save, AlertTriangle, Users, Pencil } from "lucide-react";
import type { Headcount, SaveHeadcountInput } from "@/lib/api/headcount";

type Cat = "men" | "women" | "boys" | "girls" | "firstTimers";

const CATEGORIES: { key: Cat; label: string; hint?: string }[] = [
  { key: "men", label: "Men" },
  { key: "women", label: "Women" },
  { key: "boys", label: "Boys" },
  { key: "girls", label: "Girls" },
];

/**
 * Mobile-first usher headcount entry. Large tappable steppers plus direct numeric
 * input per category, a live computed total, an optional reported-total with a
 * gentle variance indicator, and a notes field. Submitting confirms the record.
 *
 * Computed total = men + women + boys + girls. First-timers are an overlapping
 * subset of those present and are tracked separately, never added to the total.
 */
export default function HeadcountEntryForm({
  canRecord,
  disabledReason,
  existing,
  pending,
  onSubmit,
}: {
  canRecord: boolean;
  disabledReason?: string;
  existing: Headcount | null;
  pending: boolean;
  onSubmit: (input: SaveHeadcountInput, confirm: boolean) => Promise<void>;
}) {
  const [counts, setCounts] = useState<Record<Cat, number>>({
    men: existing?.men ?? 0,
    women: existing?.women ?? 0,
    boys: existing?.boys ?? 0,
    girls: existing?.girls ?? 0,
    firstTimers: existing?.firstTimers ?? 0,
  });
  const [reportedTotal, setReportedTotal] = useState<string>(
    existing?.reportedTotal != null ? String(existing.reportedTotal) : "",
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  // Re-seed when the underlying record changes (e.g. after another usher saves).
  useEffect(() => {
    setCounts({
      men: existing?.men ?? 0,
      women: existing?.women ?? 0,
      boys: existing?.boys ?? 0,
      girls: existing?.girls ?? 0,
      firstTimers: existing?.firstTimers ?? 0,
    });
    setReportedTotal(existing?.reportedTotal != null ? String(existing.reportedTotal) : "");
    setNotes(existing?.notes ?? "");
  }, [existing?.id, existing?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = counts.men + counts.women + counts.boys + counts.girls;
  const children = counts.boys + counts.girls;

  const reported = reportedTotal.trim() === "" ? null : Number(reportedTotal);
  const variance = useMemo(() => {
    if (reported == null || Number.isNaN(reported)) return null;
    const delta = reported - total;
    return delta === 0 ? null : { delta };
  }, [reported, total]);

  const firstTimersTooHigh = counts.firstTimers > total;

  function set(key: Cat, value: number) {
    setCounts((c) => ({ ...c, [key]: Math.max(0, Math.round(value) || 0) }));
    setError(null);
  }

  async function submit(confirm: boolean) {
    if (firstTimersTooHigh) {
      setError("First-timers cannot exceed the total present.");
      return;
    }
    setError(null);
    try {
      await onSubmit(
        {
          men: counts.men,
          women: counts.women,
          boys: counts.boys,
          girls: counts.girls,
          firstTimers: counts.firstTimers,
          reportedTotal: reported,
          notes: notes.trim() || null,
          confirm,
        },
        confirm,
      );
    } catch (e) {
      setError((e as { message?: string }).message ?? "Could not save the headcount.");
    }
  }

  if (!canRecord) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-6 text-center">
        <Users size={22} className="mx-auto mb-2 text-gray-300 dark:text-white/20" />
        <p className="text-sm font-semibold text-gray-700 dark:text-white/80">Not open for counting yet</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
          {disabledReason ?? "This service is not available for counting yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category steppers */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => (
          <Stepper key={c.key} label={c.label} value={counts[c.key]} onChange={(v) => set(c.key, v)} />
        ))}
      </div>

      {/* Live total */}
      <div className="rounded-2xl border border-[#87102C]/15 bg-[#87102C]/5 dark:bg-[#87102C]/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#87102C] dark:text-[#e8768a]">
              Total present
            </p>
            <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5">
              Men + Women + Boys + Girls · {children} children
            </p>
          </div>
          <p className="text-4xl font-black tabular-nums text-[#87102C] dark:text-white leading-none">
            {total}
          </p>
        </div>
      </div>

      {/* First-timers — tracked within the total */}
      <div>
        <Stepper
          label="First-timers"
          hint="counted within the total, not added"
          value={counts.firstTimers}
          onChange={(v) => set("firstTimers", v)}
          accent
          full
          invalid={firstTimersTooHigh}
        />
        {firstTimersTooHigh && (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            First-timers cannot exceed the total present ({total}).
          </p>
        )}
      </div>

      {/* Reported total + variance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1.5">
            Reported total <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            inputMode="numeric"
            value={reportedTotal}
            onChange={(e) => setReportedTotal(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Usher's own count"
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40"
          />
        </div>
        {variance && (
          <div className="flex items-end">
            <div className="w-full rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle size={13} /> Variance of {variance.delta > 0 ? "+" : ""}{variance.delta}
              </p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                Computed total ({total}) is used for analytics.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1.5">
          Notes <span className="font-normal text-gray-400">(rain, public holiday, joint service…)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 resize-none"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={pending || firstTimersTooHigh}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Check size={15} /> {existing?.status === "CONFIRMED" ? "Save changes" : "Confirm headcount"}
        </button>
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={pending || firstTimersTooHigh}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50"
        >
          <Save size={15} /> {pending ? "Saving…" : "Save draft"}
        </button>
        {existing?.status === "CONFIRMED" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <Check size={12} /> Confirmed
          </span>
        )}
        {existing?.edited && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-white/40">
            <Pencil size={11} /> Edited
          </span>
        )}
      </div>
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({
  label,
  hint,
  value,
  onChange,
  accent,
  full,
  invalid,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  accent?: boolean;
  full?: boolean;
  invalid?: boolean;
}) {
  const btn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-gray-700 dark:text-white/80 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 disabled:opacity-40";
  const btnStyle = accent
    ? "border-[#87102C]/25 bg-[#87102C]/5 hover:bg-[#87102C]/10 dark:border-[#87102C]/30"
    : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10";

  return (
    <div className={`rounded-2xl border p-3 ${invalid ? "border-rose-300 dark:border-rose-500/40" : "border-gray-200 dark:border-white/10"} bg-white dark:bg-[#1c1c1e] ${full ? "w-full" : ""}`}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-bold text-gray-700 dark:text-white/80">{label}</span>
        {hint && <span className="text-[10px] text-gray-400 dark:text-white/35">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(value - 1)} disabled={value <= 0} className={`${btn} ${btnStyle}`}>
          <Minus size={16} />
        </button>
        <input
          inputMode="numeric"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent text-center text-2xl font-black tabular-nums text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
        />
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} className={`${btn} ${btnStyle}`}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
