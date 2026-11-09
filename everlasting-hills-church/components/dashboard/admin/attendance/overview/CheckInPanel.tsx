import { Smartphone } from "lucide-react";
import type { OverviewService } from "@/lib/api/attendance-roll";
import { comparedWith, lagosToday, share } from "./overview-data";

const button =
  "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]";

/**
 * The members who checked in on the app for one service, set apart from the
 * ushers' count so nobody mistakes one for the other: how many of the roll
 * came, split into men and women, and a way into each list.
 */
export default function CheckInPanel({ service, roll, prev, onShow }: {
  service: OverviewService;
  roll: number;
  prev?: OverviewService;
  onShow: (status: "PRESENT" | "ABSENT") => void;
}) {
  const { checkedIn, checkedInByGender: split } = service;
  const missing = Math.max(0, roll - checkedIn);
  const rate = share(checkedIn, roll);
  const stillOpen = service.date === lagosToday() && service.absent === 0;

  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/60">
        <Smartphone size={13} aria-hidden="true" /> Checked in on the app
      </h3>
      <div className="mt-3 flex items-end gap-3">
        <p className="text-5xl font-black leading-none tracking-tight tabular-nums text-[#87102C] dark:text-[#E8768A]">{checkedIn}</p>
        <p className="pb-1 text-sm font-semibold text-gray-700 dark:text-white/80">
          of {roll} members
          <span className="block text-xs font-normal text-gray-500 dark:text-white/50">{rate}% of the roll</span>
        </p>
      </div>

      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10" role="img" aria-label={`${checkedIn} of ${roll} members checked in, ${rate}%`}>
        <span className="rounded-full bg-[#87102C] dark:bg-[#E8768A]" style={{ width: `${rate}%` }} />
      </div>

      <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-white/65">
        <li>
          <strong className="font-black tabular-nums text-[#1A1210] dark:text-white">{split.men}</strong> men,{" "}
          <strong className="font-black tabular-nums text-[#1A1210] dark:text-white">{split.women}</strong> women
          {split.unknown > 0 && <>, {split.unknown} with no gender on their profile</>}
        </li>
        <li>
          <strong className="font-black tabular-nums text-[#1A1210] dark:text-white">{missing}</strong>{" "}
          {stillOpen ? "haven't checked in yet" : "didn't check in"}
        </li>
        {prev && <li className="text-xs text-gray-500 dark:text-white/50">{comparedWith(checkedIn, prev.checkedIn, prev.date)}</li>}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onShow("PRESENT")} className={`${button} bg-[#87102C] text-white hover:bg-[#6d0d24]`}>
          See who checked in
        </button>
        {/* Absences are only written when the service closes, so until then there is no list to open. */}
        {!stillOpen && <button
          type="button"
          onClick={() => onShow("ABSENT")}
          className={`${button} border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5`}
        >
          See who didn&apos;t
        </button>}
      </div>
    </div>
  );
}
