"use client";

import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";
import type { EventRsvp } from "@/types";
import type { CheckInMutation } from "./useEventRsvps";

const AVATAR_TONES = [
  "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400",
  "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
];

function toneFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

const TH =
  "text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap";
const TD = "px-3 py-3 border-t border-gray-100 dark:border-white/[0.06]";

export default function RsvpTable({ rsvps, checkIn }: { rsvps: EventRsvp[]; checkIn: CheckInMutation }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-6xl mx-auto">
        <thead>
          <tr>
            <th className={TH}>Name</th>
            <th className={TH}>Email</th>
            <th className={TH}>Phone</th>
            <th className={`${TH} text-center`}>Attendees</th>
            <th className={TH}>Message</th>
            <th className={TH}>Status</th>
            <th className={TH}>Submitted</th>
            <th className={`${TH} text-center`}>Present</th>
          </tr>
        </thead>
        <tbody>
          {rsvps.map((r) => {
            const isToggling = checkIn.isPending && checkIn.variables?.rsvpId === r.id;
            return (
              <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                <td className={TD}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${toneFor(r.fullName)}`}
                    >
                      {r.fullName.trim()[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">
                      {r.fullName}
                    </span>
                  </div>
                </td>
                <td className={`${TD} text-gray-600 dark:text-gray-300 truncate max-w-[200px]`}>{r.email}</td>
                <td className={`${TD} text-gray-500 dark:text-gray-400 whitespace-nowrap`}>{r.phone ?? "—"}</td>
                <td className={`${TD} text-center font-semibold text-[#87102C] dark:text-[#e8768a]`}>
                  {r.attendees}
                </td>
                <td className={`${TD} text-gray-500 dark:text-gray-400 max-w-[220px] truncate italic`}>
                  {r.message ? `"${r.message}"` : "—"}
                </td>
                <td className={TD}>
                  {r.isMember ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      <CheckCircle2 size={10} /> Member
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                      <Sparkles size={10} /> New
                    </span>
                  )}
                </td>
                <td className={`${TD} text-gray-400 dark:text-gray-500 whitespace-nowrap`}>
                  {new Date(r.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className={`${TD} text-center`}>
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => checkIn.mutate({ rsvpId: r.id, checkedIn: !r.checkedIn })}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap disabled:opacity-50 ${
                      r.checkedIn
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15"
                    }`}
                  >
                    {isToggling ? (
                      <Loader size="xs" />
                    ) : r.checkedIn ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Circle size={12} />
                    )}
                    {r.checkedIn ? "Present" : "Mark present"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
