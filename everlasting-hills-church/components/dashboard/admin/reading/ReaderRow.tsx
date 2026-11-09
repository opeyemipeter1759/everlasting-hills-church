import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import type { Reader, ReaderPlan } from "@/lib/api/admin-reading";
import { initials, lastRead, STATE } from "./shared";
import ReaderPlans from "./ReaderPlans";

/** One member: who they are, their state, last read and streak, their plans, and 7/30-day counts. */
export default function ReaderRow({ reader, today, onRemovePlan }: { reader: Reader; today: string; onRemovePlan: (plan: ReaderPlan) => void }) {
  const state = STATE[reader.state];
  return (
    <li className="flex flex-col gap-3 bg-white px-4 py-3.5 dark:bg-white/[0.02] lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {reader.photoUrl ? (
          <Image src={reader.photoUrl} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-xs font-bold text-[#87102C] dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]">
            {initials(reader.name)}
          </span>
        )}
        <div className="min-w-0">
          <Link
            href={`/dashboard/admin/members/${reader.memberId}`}
            className="block truncate text-sm font-bold text-[#111] hover:text-[#87102C] dark:text-white dark:hover:text-[#FFB3C1]"
          >
            {reader.name}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-white/50">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${state.badge}`}>{state.label}</span>
            <span>Last read {lastRead(reader.lastReadOn, today)}</span>
            {reader.currentStreak > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Flame size={11} aria-hidden="true" className="text-[#87102C] dark:text-[#FFB3C1]" />
                {reader.currentStreak}-day streak
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-1.5 lg:max-w-[45%] lg:justify-end">
        <ReaderPlans reader={reader} onRemovePlan={onRemovePlan} />
      </div>

      <dl className="flex shrink-0 gap-5 lg:w-32 lg:justify-end">
        <div className="text-center">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white/40">7 days</dt>
          <dd className="text-sm font-bold tabular-nums text-[#111] dark:text-white">{reader.readingsLast7}</dd>
        </div>
        <div className="text-center">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white/40">30 days</dt>
          <dd className="text-sm font-bold tabular-nums text-[#111] dark:text-white">{reader.readingsLast30}</dd>
        </div>
      </dl>
    </li>
  );
}
