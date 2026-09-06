"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { usePendingHeadcounts, type PendingService } from "@/lib/api/headcount";
import { prettyDate } from "@/components/dashboard/admin/attendance/headcount/date-utils";

const TYPE_LABEL: Record<string, string> = {
  SUNDAY: "Sunday",
  WEDNESDAY: "Wednesday",
  SPECIAL: "Special",
};

/**
 * How overdue a count is, in words.
 *
 * Ushers work in "last Sunday", not in dates, and the age is the thing that
 * decides what to do next: today's service is simply not counted yet, while one
 * from three weeks ago is a genuine hole in the record.
 */
function agePhrase(daysAgo: number): { text: string; urgent: boolean } {
  if (daysAgo <= 0) return { text: "Today", urgent: false };
  if (daysAgo === 1) return { text: "Yesterday", urgent: false };
  if (daysAgo < 7) return { text: `${daysAgo} days ago`, urgent: false };
  if (daysAgo < 14) return { text: "Last week", urgent: true };
  return { text: `${Math.floor(daysAgo / 7)} weeks ago`, urgent: true };
}

function BacklogRow({ service }: { service: PendingService }) {
  const age = agePhrase(service.daysAgo);

  return (
    <li className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{service.name}</p>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-white/[0.06] dark:text-white/45">
            {TYPE_LABEL[service.serviceType] ?? service.serviceType}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">
          {prettyDate(service.date)} ·{" "}
          <span className={age.urgent ? "font-semibold text-amber-600 dark:text-amber-400" : ""}>
            {age.text}
          </span>
        </p>
      </div>

      {/* Deep-links to the record screen with the date already chosen, so the
          usher never has to find it in a date picker. */}
      <Link
        href={`/dashboard/usher?date=${service.date}`}
        className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-xl bg-[#87102C] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#6E0C24] sm:self-auto"
      >
        Record now <ArrowRight size={13} />
      </Link>
    </li>
  );
}

export default function HeadcountBacklog() {
  const { data, isLoading, isError, error } = usePendingHeadcounts(50);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        Could not load the backlog — {(error as { message?: string })?.message ?? "please try again."}
      </div>
    );
  }

  const services = data ?? [];

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 py-12 text-center dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
        <CheckCircle2 size={26} className="mx-auto mb-3 text-emerald-500" />
        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
          Every service has been counted
        </p>
        <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/60">
          Nothing is waiting on you.
        </p>
      </div>
    );
  }

  const overdue = services.filter((s) => s.daysAgo >= 7).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs dark:border-amber-500/20 dark:bg-amber-500/10">
        <AlertTriangle size={14} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold text-amber-800 dark:text-amber-300">
          {services.length} service{services.length === 1 ? "" : "s"} without a headcount
        </span>
        {overdue > 0 && (
          <span className="text-amber-700/80 dark:text-amber-400/70">
            · {overdue} over a week old
          </span>
        )}
      </div>

      <ul className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#161618]">
        {services.map((service) => (
          <BacklogRow key={service.id} service={service} />
        ))}
      </ul>
    </div>
  );
}
