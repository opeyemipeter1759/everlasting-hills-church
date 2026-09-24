"use client";

import Link from "next/link";
import { ChevronRight, HandCoins } from "lucide-react";
import { SOUND_MEDIA, formatNaira, usePledges } from "@/lib/api/pledges";

/**
 * The Sound & Media Project on the admin home page: what has been pledged,
 * what has actually been received, and what is still outstanding.
 *
 * The pledges page lists every pledger; this answers the two questions a
 * pastor asks in passing — how much has come in, and how many people have
 * finished paying.
 */
export default function ProjectPledgesCard() {
  const { data, isLoading, isError, refetch } = usePledges();
  const totals = data?.totals;
  const pledges = data?.pledges ?? [];
  const completed = pledges.filter((pledge) => pledge.balance <= 0).length;
  const percent =
    totals && totals.amount > 0 ? Math.min(100, Math.round((totals.amountGiven / totals.amount) * 100)) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:border-white/[0.09] dark:bg-white/[0.05] dark:shadow-none">
      <div className="flex items-center gap-3 border-b border-[#E7CDD3]/40 px-6 py-4 dark:border-white/[0.07]">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFF4F6] dark:bg-[#87102C]/25">
          <HandCoins size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
            Sacrificial giving
          </p>
          <h3 className="-mt-0.5 text-sm font-bold text-[#111] dark:text-white">{SOUND_MEDIA.title}</h3>
        </div>
        <Link
          href="/dashboard/admin/pledges"
          className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
        >
          All pledges <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <p className="px-6 py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">Loading…</p>
      ) : isError || !totals ? (
        <p role="alert" className="px-6 py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">
          Pledges couldn&apos;t load.{" "}
          <button type="button" onClick={() => refetch()} className="min-h-9 font-bold text-[#87102C] underline dark:text-[#FFB3C1]">
            Try again
          </button>
        </p>
      ) : (
        <div className="px-6 py-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] font-semibold text-[#8a7e80] dark:text-white/45">Pledged</dt>
              <dd className="mt-0.5 break-words font-display text-xl font-bold tabular-nums text-[#111] dark:text-white">
                {formatNaira(totals.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Received so far</dt>
              <dd className="mt-0.5 break-words font-display text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatNaira(totals.amountGiven)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#8a7e80] dark:text-white/45">Outstanding</dt>
              <dd className="mt-0.5 break-words font-display text-xl font-bold tabular-nums text-[#111] dark:text-white">
                {formatNaira(totals.balance)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#8a7e80] dark:text-white/45">Pledges</dt>
              <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-[#111] dark:text-white">
                {totals.pledges}
                <span className="ml-1 text-xs font-semibold text-[#8a7e80] dark:text-white/45">
                  · {completed} completed
                </span>
              </dd>
            </div>
          </dl>

          <div
            role="progressbar"
            aria-label="Share of pledges received"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#FFE8ED] dark:bg-white/[0.08]"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#87102C] to-emerald-500 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs font-bold text-[#8a7e80] dark:text-white/45">
            {percent}% of what was pledged has come in
          </p>
        </div>
      )}
    </div>
  );
}
