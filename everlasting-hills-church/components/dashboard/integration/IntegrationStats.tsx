"use client";

import { CalendarX, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PipelinePage } from "@/lib/api/pipeline";

function Card({ icon: Icon, value, label, note, tone }: { icon: LucideIcon; value?: number | null; label: string; note: string; tone: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 opacity-80 ${tone}`} />
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/[0.07] dark:text-white/50">
          <Icon size={17} aria-hidden="true" />
        </span>
        {value === undefined ? null : value === null ? (
          <span className="block h-7 w-10 animate-pulse rounded-md bg-gray-200 dark:bg-white/10" />
        ) : (
          <p className="text-2xl font-bold leading-none tabular-nums text-[#111] dark:text-white sm:text-3xl">{value}</p>
        )}
      </div>
      <p className="mt-2.5 text-sm font-semibold text-[#111] dark:text-white">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-white/45">{note}</p>
    </div>
  );
}

/**
 * Two figures, both taken from the list below under the same filters: how
 * many are integrated, and how many missed the service picked in Absent from.
 * Side by side on a phone, so they cost one row.
 */
export function IntegrationStats({ page, serviceName }: { page?: PipelinePage; serviceName: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:max-w-2xl">
      <Card
        icon={HeartHandshake}
        tone="bg-emerald-500"
        value={page ? page.counts.INTEGRATED : null}
        label="Integrated"
        note="Settled in, and approved by their unit lead"
      />
      <Card
        icon={CalendarX}
        tone="bg-rose-500"
        // No number until a service is picked: a zero would read as nobody missing.
        value={!serviceName ? undefined : page ? page.counts.all : null}
        label="Absent"
        note={serviceName ? `Missed ${serviceName}` : "Pick a service under Absent from"}
      />
    </div>
  );
}
