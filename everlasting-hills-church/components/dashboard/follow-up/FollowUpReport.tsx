"use client";

import { useFollowUpReportsUnit, useMyFollowUpUnit } from "@/lib/api/follow-up-pipeline";
import { ServiceReportPanel } from "./ServiceReportPanel";

/**
 * The Report tab: the Follow Up unit's service report. The unit comes from
 * /follow-up/reports-unit (its lead, or anyone church-wide); a head of
 * department has no reports unit of their own, so falls back to my-unit.
 */
export function FollowUpReport() {
  const { data: reportsUnit, isLoading: loadingReports } = useFollowUpReportsUnit();
  const { data: myUnit, isLoading: loadingMine } = useMyFollowUpUnit();
  const unit = reportsUnit ?? myUnit ?? null;

  if (loadingReports || loadingMine) {
    return <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />;
  }

  if (!unit) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-sm font-semibold text-[#111] dark:text-white">No unit to report on</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-white/45">
          Reports are sent by the Follow Up unit&rsquo;s lead. Ask an admin to make you its lead if you should be sending them.
        </p>
      </div>
    );
  }

  return <ServiceReportPanel unitId={unit.id} unitName={unit.name} />;
}
