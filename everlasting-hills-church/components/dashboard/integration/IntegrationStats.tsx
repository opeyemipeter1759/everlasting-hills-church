"use client";

import { CalendarCheck, CalendarX, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PipelinePage } from "@/lib/api/pipeline";

/** The service picked on the page, with how many came and how many missed it (undefined while loading). */
export interface ServiceAttendance {
  name: string;
  came?: number;
  missed?: number;
}

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
 * Integrated, then who came to and who missed the service picked. Every figure
 * is a count the API returned. No number until a service is picked: a zero
 * would read as nobody missing.
 */
export function IntegrationStats({ page, service }: { page?: PipelinePage; service: ServiceAttendance | null }) {
  const count = (n: number | undefined) => (!service ? undefined : n ?? null);
  return (
    <div className="grid grid-cols-3 gap-3 xl:max-w-3xl">
      <Card
        icon={HeartHandshake}
        tone="bg-emerald-500"
        value={page ? page.counts.INTEGRATED : null}
        label="Integrated"
        note="Settled in, and approved by their team leads"
      />
      <Card
        icon={CalendarCheck}
        tone="bg-sky-500"
        value={count(service?.came)}
        label="Came"
        note={service ? `Checked in at ${service.name}` : "Pick a service"}
      />
      <Card
        icon={CalendarX}
        tone="bg-rose-500"
        value={count(service?.missed)}
        label="Missed"
        note={service ? `Missed ${service.name}` : "Pick a service"}
      />
    </div>
  );
}
