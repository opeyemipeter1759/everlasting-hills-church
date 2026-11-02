"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { usePreviewSlots, type HostDetail } from "@/lib/api/one-on-one";
import { Select } from "@/components/ui/select";
import { Section, addDays, durationLabel, formatDay, formatTime, lagosToday, muted } from "./ui";

export default function PreviewCard({ host }: { host: HostDetail }) {
  const active = host.sessionTypes.filter((t) => t.active);
  const [typeId, setTypeId] = useState(active[0]?.id ?? "");
  useEffect(() => {
    if (!active.some((t) => t.id === typeId)) setTypeId(active[0]?.id ?? "");
  }, [active, typeId]);

  const from = lagosToday();
  const to = addDays(from, Math.min(host.horizonDays, 56));
  const preview = usePreviewSlots(host.id, typeId || null, from, to);
  const days = preview.data ?? [];

  return (
    <Section icon={Eye} eyebrow="Preview" title="What members will see">
      {active.length === 0 ? (
        <p className={`text-sm ${muted}`}>Switch on a session type to see your open times.</p>
      ) : (
        <>
          <div className="mb-4 sm:max-w-[18rem]">
            <Select
              aria-label="Session type to preview"
              value={typeId}
              onChange={setTypeId}
              options={active.map((t) => ({ value: t.id, label: `${t.name} · ${durationLabel(t.durationMinutes)}` }))}
            />
          </div>
          {preview.isLoading ? (
            <p className={`text-sm ${muted}`}>Working out your open times…</p>
          ) : preview.isError ? (
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Couldn’t load the preview.</p>
          ) : days.length === 0 ? (
            <p className={`text-sm ${muted}`}>
              No open times in the next {Math.round(host.horizonDays / 7)} weeks. Add hours above, or check your days off and booking
              rules.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-[#E7CDD3]/50 dark:divide-white/[0.07]">
              {days.slice(0, 8).map((d) => (
                <li key={d.date} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3 py-2.5">
                  <span className="pt-1 text-sm font-semibold tabular-nums text-[#111] dark:text-white">{formatDay(d.date)}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {d.slots.map((s) => (
                      <span
                        key={s.startsAt}
                        className="rounded-lg bg-[#FFE8ED] px-2.5 py-1 text-xs font-bold tabular-nums text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
                      >
                        {formatTime(s.startsAt)}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {days.length > 8 && <p className={`mt-2 text-xs ${muted}`}>and {days.length - 8} more days.</p>}
        </>
      )}
    </Section>
  );
}
