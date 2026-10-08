import type { EvangelismTally } from "@/lib/api/evangelism";
import { Empty } from "./shared";

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-[#FFF4F6]/70 dark:bg-white/[0.04] px-3 py-3 text-center">
      <p className="text-2xl font-bold text-[#87102C] dark:text-[#e8768a] tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/45">{label}</p>
    </div>
  );
}

/** People this member preached to, from the Evangelism records. Counts only. */
export default function EvangelismSection({ tally }: { tally: EvangelismTally }) {
  if (tally.reached === 0) return <Empty>No one recorded as reached by this member yet.</Empty>;
  const last = tally.lastContactDate
    ? new Date(tally.lastContactDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })
    : null;
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Figure value={tally.reached} label="Reached" />
        <Figure value={tally.saved} label="Saved" />
        <Figure value={tally.alreadySaved} label="Already saved" />
      </div>
      <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-white/60">
        {last && <p>Last preached: {last}</p>}
        <p>
          This year: {tally.thisYear.reached} reached · {tally.thisYear.saved} saved
        </p>
      </div>
    </>
  );
}
