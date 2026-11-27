"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";
import { previewSchedule } from "@/lib/api/programs-admin";
import { dateLagos, clockLagos } from "@/components/programs/live";
import { DAYS, defaultPreset, MONTHS, presetFromSchedule, PRESET_LABEL, scheduleFromPreset, type Preset } from "./schedule-presets";
import type { ProgramDraft } from "./useProgramDraft";
import { card, hint, input, label, sectionTitle, selectBox } from "./ui";

export type SchedulePreview = { schedule: string; eyebrow: string; next: { start: string; end: string }[] } | null;

const presetOptions = (Object.keys(PRESET_LABEL) as Preset["kind"][]).map((k) => ({ value: k, label: PRESET_LABEL[k] }));
const monthOptions = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));
const hours = (min: number) => Math.round((min / 60) * 10) / 10;

/** The schedule in plain choices; the dates it gives are worked out by the server, live, as it changes. */
export function ScheduleSection({ draft, onPreview }: { draft: ProgramDraft; onPreview: (p: SchedulePreview) => void }) {
  const { fields: f, patch } = draft;
  const preset = presetFromSchedule(f);
  const [preview, setPreview] = useState<SchedulePreview>(null);
  const apply = (p: Preset) => patch(scheduleFromPreset(p));

  useEffect(() => {
    const t = window.setTimeout(() => {
      previewSchedule({ cadence: f.cadence, programType: f.programType, recurrenceRule: f.recurrenceRule, startTime: f.startTime, durationMinutes: f.durationMinutes, startOffsetDays: f.startOffsetDays, dateStatus: f.dateStatus })
        .then((p) => {
          setPreview(p);
          onPreview(p);
        })
        .catch(() => setPreview(null));
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.cadence, f.programType, f.recurrenceRule, f.startTime, f.durationMinutes, f.startOffsetDays, f.dateStatus]);

  const timeFields = "startTime" in preset && (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={label}>Starts at</span>
        <input type="time" className={`${input} mt-1`} value={preset.startTime} onChange={(e) => apply({ ...preset, startTime: e.target.value } as Preset)} />
      </label>
      {"durationMinutes" in preset && (
        <label className="block">
          <span className={label}>Lasts (hours)</span>
          <input type="number" min={0.5} max={336} step={0.5} className={`${input} mt-1`} value={hours(preset.durationMinutes)} onChange={(e) => apply({ ...preset, durationMinutes: Math.max(30, Math.round(Number(e.target.value) * 60)) } as Preset)} />
        </label>
      )}
    </div>
  );

  return (
    <section id="schedule" className={`${card} space-y-4`} aria-labelledby="schedule-title">
      <h2 id="schedule-title" className={sectionTitle}>Schedule</h2>
      <div>
        <span className={label} id="preset-label">How often</span>
        <div className="mt-1">
          <Select value={preset.kind} onChange={(v) => apply(defaultPreset(v as Preset["kind"]))} options={presetOptions} aria-labelledby="preset-label" className={selectBox} />
        </div>
      </div>
      {preset.kind === "weekly" && (
        <fieldset>
          <legend className={label}>On these days</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = preset.days.includes(d.code);
              return (
                <button key={d.code} type="button" aria-pressed={on} aria-label={d.long} onClick={() => apply({ ...preset, days: on && preset.days.length > 1 ? preset.days.filter((x) => x !== d.code) : on ? preset.days : [...preset.days, d.code] })}
                  className={`min-h-10 rounded-xl border px-3 text-sm font-semibold ${on ? "border-[#87102C] bg-[#87102C] text-white" : "border-gray-300 text-gray-800 dark:border-white/15 dark:text-white/85"}`}>
                  {d.short}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {preset.kind === "monthlyDay" && (
        <label className="block">
          <span className={label}>Day of the month</span>
          <input type="number" min={1} max={28} className={`${input} mt-1 max-w-[8rem]`} value={preset.day} onChange={(e) => apply({ ...preset, day: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })} />
          <span className={hint}>1 to 28, so it happens every month.</span>
        </label>
      )}
      {(preset.kind === "yearlyLastWeekend" || preset.kind === "yearlyEditions") && (
        <div>
          <span className={label} id="month-label">Month</span>
          <div className="mt-1 max-w-xs">
            <Select value={String(preset.month)} onChange={(v) => apply({ ...preset, month: Number(v) })} options={monthOptions} aria-labelledby="month-label" className={selectBox} />
          </div>
          {preset.kind === "yearlyEditions" && <p className={hint}>Set each year&apos;s dates and theme under Editions.</p>}
        </div>
      )}
      {timeFields}
      {preset.kind === "yearlyLastWeekend" && (
        <label className="flex items-center gap-2 text-sm text-[#111] dark:text-white/85">
          <input type="checkbox" checked={preset.confirmed} onChange={(e) => apply({ ...preset, confirmed: e.target.checked })} className="h-4 w-4 accent-[#87102C]" />
          The date is confirmed (otherwise the page says &quot;{MONTHS[preset.month - 1]}. Date to be announced&quot;)
        </label>
      )}
      <p className="text-xs text-gray-600 dark:text-white/55">Times are Lagos time (WAT).</p>
      <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-white/5" aria-live="polite">
        <p className="font-semibold text-[#111] dark:text-white">{preview?.schedule ?? "Working it out…"}</p>
        {preview && preview.next.length > 0 && (
          <ul className="mt-2 space-y-1 text-gray-700 dark:text-white/70">
            {preview.next.map((n) => (
              <li key={n.start}>{dateLagos(new Date(n.start), true)}, from {clockLagos(new Date(n.start))}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
