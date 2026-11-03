"use client";

import { ArrowRight } from "lucide-react";
import type { HostSummary } from "@/lib/api/one-on-one";
import { durationLabel, formatTime } from "../manage/ui";
import { Portrait } from "./parts";

function nextOpeningLabel(iso: string | null): string | null {
  if (!iso) return null;
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
  return `Next opening ${day}, ${formatTime(iso)}`;
}

/**
 * A pastor's own page: who they are, in their words, then every session they
 * offer. Where a pastor's share link lands, for members and visitors alike.
 */
export default function HostProfile({
  host,
  index,
  onChoose,
}: {
  host: HostSummary;
  index: number;
  onChoose: (typeId: string) => void;
}) {
  const next = nextOpeningLabel(host.nextOpening);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5 rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 dark:border-white/[0.09] dark:bg-white/[0.05] sm:flex-row sm:items-start sm:gap-7 sm:p-8">
        <Portrait name={host.displayName} index={index} size="lg" />
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="font-serif text-3xl font-bold leading-tight text-[#111] dark:text-white">{host.displayName}</h2>
          {host.title && <p className="text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">{host.title}</p>}
          <p className="max-w-2xl text-[15px] leading-relaxed text-[#3B2A2E] dark:text-white/80">
            {host.bio ?? `${host.displayName} makes time to sit with people one on one, to listen, pray and talk through whatever you’re carrying.`}
          </p>
          {next && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
              {next}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="sessions-title" className="flex flex-col gap-3">
        <h3 id="sessions-title" className="text-sm font-bold text-[#111] dark:text-white">
          Sessions with {host.displayName}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {host.sessionTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChoose(t.id)}
              className="group flex flex-col gap-2 rounded-2xl border border-[#E7CDD3]/60 bg-white p-5 text-left transition hover:border-[#87102C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] dark:border-white/[0.09] dark:bg-white/[0.05]"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-serif text-xl font-bold leading-snug text-[#111] dark:text-white">{t.name}</span>
                <span className="whitespace-nowrap rounded-full bg-[#FFE8ED] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
                  {durationLabel(t.durationMinutes)}
                </span>
              </span>
              {t.description && <span className="text-sm text-[#7A6A6F] dark:text-white/60">{t.description}</span>}
              {t.joint && <span className="text-xs font-semibold text-[#7A6A6F] dark:text-white/50">With both pastors together</span>}
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                Pick a time <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
