"use client";

import { useState } from "react";
import type { ReportsSummary } from "@/lib/api/prayer-watch-overview";
import { durationShort, nightShort } from "@/lib/prayer-watch-nights";
import HoursChart from "./HoursChart";
import { longDate, panel, panelHint, panelTitle } from "./format";

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex min-w-0 flex-col sm:min-w-[120px]">
      <span className="text-xs font-medium text-gray-500 dark:text-white/55">{label}</span>
      <span className="text-xl font-semibold tabular-nums text-[#1A1210] dark:text-white">{value}</span>
      <span className="text-xs text-gray-500 dark:text-white/50">{note}</span>
    </div>
  );
}

/** Hours prayed each night, from the watch leaders' reports. */
export default function HoursPrayed({ reports, watches }: { reports: ReportsSummary | null; watches: number }) {
  const [asTable, setAsTable] = useState(false);

  if (!reports?.trackingSince) {
    return (
      <section className={panel} aria-labelledby="hours-title">
        <h2 id="hours-title" className={panelTitle}>
          Hours prayed each night
        </h2>
        <p className={`${panelHint} mt-1 max-w-xl`}>
          No reports yet. After each watch, its leader reports when it ran, how many prayed and the handover. The hours show here from the first report.
        </p>
      </section>
    );
  }

  const latest = new Date(`${reports.daily[reports.daily.length - 1].night}T00:00:00Z`);
  const monday = new Date(latest.getTime() - ((latest.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
  const thisWeekOf = reports.fullNightMinutes * reports.daily.filter((d) => d.tracked && d.night >= monday).length;
  const shown = reports.daily.filter((d) => d.tracked).reverse();

  return (
    <section className={panel} aria-labelledby="hours-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="hours-title" className={panelTitle}>
            Hours prayed each night
          </h2>
          <p className={panelHint}>From the watch leaders&apos; reports, the last four weeks. Reports began {longDate(`${reports.trackingSince}T12:00:00Z`)}.</p>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
        >
          {asTable ? "Show as chart" : "Show as table"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
        <Figure label="This week so far" value={durationShort(reports.thisWeekMinutes)} note={`of ${durationShort(thisWeekOf)} possible`} />
        <Figure label="Last week" value={durationShort(reports.lastWeekMinutes)} note={`of ${durationShort(reports.fullNightMinutes * 6)} across six nights`} />
        <Figure label="Reports in" value={`${reports.reportsIn} of ${reports.reportsDue}`} note={`${reports.handoversMade} with the handover confirmed`} />
        <Figure label="People per watch" value={reports.averagePeople === null ? "None yet" : String(reports.averagePeople)} note="Average across reports" />
      </div>

      {asTable ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-white/50">
              <th className="py-1 font-semibold">Night</th>
              <th className="py-1 text-right font-semibold">Prayed</th>
              <th className="py-1 text-right font-semibold">Watches reported</th>
              <th className="py-1 text-right font-semibold">People</th>
            </tr>
          </thead>
          <tbody className="tabular-nums text-[#1A1210] dark:text-white/85">
            {shown.map((d) => (
              <tr key={d.night} className="border-t border-gray-100 dark:border-white/5">
                <td className="py-1.5">{nightShort(d.night)}</td>
                <td className="py-1.5 text-right">{durationShort(d.minutes)}</td>
                <td className="py-1.5 text-right">
                  {d.reported} of {watches}
                </td>
                <td className="py-1.5 text-right">{d.people}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <HoursChart daily={reports.daily} fullNightMinutes={reports.fullNightMinutes} watches={watches} />
      )}
    </section>
  );
}
