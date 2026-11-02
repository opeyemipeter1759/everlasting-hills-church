"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Plus, X } from "lucide-react";
import { useReplaceRules, type HostDetail, type WeeklyWindow } from "@/lib/api/one-on-one";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { Section, WEEKDAYS, btnGhost, btnPrimary, input, muted } from "./ui";

type Range = { startTime: string; endTime: string };
type Week = Record<number, Range[]>;

function toWeek(rules: WeeklyWindow[]): Week {
  const week: Week = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const r of rules) week[r.weekday].push({ startTime: r.startTime, endTime: r.endTime });
  return week;
}

function toRules(week: Week): WeeklyWindow[] {
  return Object.entries(week).flatMap(([day, ranges]) => ranges.map((r) => ({ weekday: Number(day), ...r })));
}

/** What would stop this day from saving, in words, or null. */
function problemWith(ranges: Range[]): string | null {
  const sorted = [...ranges].sort((a, b) => a.startTime.localeCompare(b.startTime));
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].startTime >= sorted[i].endTime) return "Each range must end after it starts.";
    if (i > 0 && sorted[i].startTime < sorted[i - 1].endTime) return "Two ranges overlap.";
  }
  return null;
}

export default function WeeklyHoursCard({ host }: { host: HostDetail }) {
  const save = useReplaceRules(host.id);
  const saved = useMemo(() => toWeek(host.rules), [host.rules]);
  const [week, setWeek] = useState<Week>(saved);
  useEffect(() => setWeek(saved), [saved]);

  const dirty = JSON.stringify(toRules(week)) !== JSON.stringify(toRules(saved));
  const problems = Object.fromEntries(Object.entries(week).map(([d, r]) => [d, problemWith(r)]));
  const hasProblem = Object.values(problems).some(Boolean);

  const update = (day: number, ranges: Range[]) => setWeek((w) => ({ ...w, [day]: ranges }));

  async function onSave() {
    try {
      await save.mutateAsync(toRules(week));
      showToast.success("Hours saved");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't save your hours."));
    }
  }

  return (
    <Section
      icon={Clock3}
      eyebrow="Weekly"
      title="When you're available"
      action={
        <button type="button" className={btnPrimary} disabled={!dirty || hasProblem || save.isPending} onClick={onSave}>
          {save.isPending ? "Saving…" : "Save hours"}
        </button>
      }
    >
      <p className={`mb-3 text-sm ${muted}`}>
        Lagos time. Anything already in your Google Calendar is hidden from members automatically, so these can stay simple.
      </p>
      <ul className="divide-y divide-[#E7CDD3]/50 dark:divide-white/[0.07]">
        {WEEKDAYS.map(({ day, short, long }) => {
          const ranges = week[day];
          return (
            <li key={day} className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-3 py-3">
              <span className="pt-2 text-sm font-bold text-[#111] dark:text-white" title={long}>
                {short}
              </span>
              <div className="flex flex-col gap-2">
                {ranges.length === 0 && (
                  <div className="flex items-center gap-2 pt-1.5">
                    <span className={`text-sm ${muted}`}>Unavailable</span>
                  </div>
                )}
                {ranges.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      aria-label={`${long} range ${i + 1} start`}
                      className={`${input} w-[7.5rem]`}
                      value={r.startTime}
                      step={900}
                      onChange={(e) => update(day, ranges.map((x, j) => (j === i ? { ...x, startTime: e.target.value } : x)))}
                    />
                    <span className={muted}>to</span>
                    <input
                      type="time"
                      aria-label={`${long} range ${i + 1} end`}
                      className={`${input} w-[7.5rem]`}
                      value={r.endTime}
                      step={900}
                      onChange={(e) => update(day, ranges.map((x, j) => (j === i ? { ...x, endTime: e.target.value } : x)))}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${long} range ${i + 1}`}
                      className="rounded-lg p-1.5 text-[#8a7e80] hover:bg-[#FFE8ED] hover:text-[#87102C] dark:hover:bg-white/[0.06]"
                      onClick={() => update(day, ranges.filter((_, j) => j !== i))}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className={`${btnGhost} px-2.5 py-1 text-xs`}
                    onClick={() => {
                      const last = ranges[ranges.length - 1];
                      update(day, [...ranges, last ? { startTime: last.endTime, endTime: last.endTime < "16:00" ? "16:00" : "18:00" } : { startTime: "10:00", endTime: "16:00" }]);
                    }}
                  >
                    <Plus size={13} /> {ranges.length === 0 ? "Add hours" : "Add another range"}
                  </button>
                </div>
                {problems[day] && <p className="text-xs font-semibold text-red-700 dark:text-red-300">{problems[day]}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
