import { CalendarCheck, Clock3 } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { card, hdrBdr, kicker, cardTitle, muted } from "./tokens";
import { standingLabel, relativeTime } from "./helpers";
import { CircleProgress } from "./Primitives";

export function WarmAttendanceStat({ attendanceRate, attendanceCount, attendanceTotal, lastServiceDate, recentServices }: {
  attendanceRate: number;
  attendanceCount: number;
  attendanceTotal: number;
  lastServiceDate: string | null;
  recentServices: MemberHomeProps["recentServices"];
}) {
  const standing = standingLabel(attendanceRate);

  const daysSinceLast = lastServiceDate
    ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / 86_400_000)
    : null;

  return (
    <section className={card}>
      <div className={`${hdrBdr} px-5 py-4`}>
        <p className={kicker}>My Journey</p>
        <h3 className={cardTitle}>Attendance this month</h3>
      </div>
      <div className="flex-1 p-5 flex flex-col items-center gap-4">
        {/* Ring with % + fraction inside */}
        <div className="relative my-1">
          <CircleProgress value={attendanceRate} size={112} strokeWidth={9} stroke={standing.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[26px] font-black text-[#111] dark:text-white leading-none tracking-tight">
              {attendanceRate}<span className="text-sm font-bold">%</span>
            </p>
            <p className={`text-[10px] font-bold mt-1 ${muted}`}>
              {attendanceCount}/{attendanceTotal} services
            </p>
          </div>
        </div>

        {/* Standing badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${standing.bg} ${standing.color}`}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: standing.ring }} />
          {standing.text}
        </span>

        <div className="w-full flex flex-col gap-1.5 pt-3 mt-1 border-t border-[#E7CDD3]/50 dark:border-white/[0.07]">
          <div className={`flex items-center gap-2 text-[11px] ${muted}`}>
            <CalendarCheck size={13} className="flex-shrink-0 opacity-70" />
            <span>
              {attendanceTotal > 0
                ? `${attendanceTotal} service day${attendanceTotal !== 1 ? "s" : ""} this month (Sun & Wed)`
                : "No services scheduled this month yet"}
            </span>
          </div>
          {daysSinceLast !== null && daysSinceLast <= 60 && (
            <div className={`flex items-center gap-2 text-[11px] ${muted}`}>
              <Clock3 size={13} className="flex-shrink-0 opacity-70" />
              <span>Last attended {relativeTime(lastServiceDate as string).toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
