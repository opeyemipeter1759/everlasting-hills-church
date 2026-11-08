import { CalendarCheck, Clock3 } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { card, hdrBdr, kicker, cardTitle, muted } from "./tokens";
import { standingLabel, relativeTime } from "./helpers";
import { CircleProgress } from "./Primitives";

/** One dot per service day this month, filled for each one attended. Capped so a long month stays on one line. */
const MAX_DOTS = 12;

/**
 * Attendance this month, laid out wide: the ring on the left, and beside it
 * the standing, one dot per service day, and when they last came. It stacks
 * on a phone. Sized to its content, so it never stands taller than it needs.
 */
export function WarmAttendanceStat({ attendanceRate, attendanceCount, attendanceTotal, lastServiceDate }: {
  attendanceRate: number;
  attendanceCount: number;
  attendanceTotal: number;
  lastServiceDate: string | null;
  recentServices: MemberHomeProps["recentServices"];
}) {
  const standing = standingLabel(attendanceRate);
  const daysSinceLast = lastServiceDate ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / 86_400_000) : null;
  const dots = Math.min(attendanceTotal, MAX_DOTS);

  return (
    <section className={card}>
      <div className={`${hdrBdr} px-5 py-4`}>
        <p className={kicker}>My Journey</p>
        <h3 className={cardTitle}>Attendance this month</h3>
      </div>
      <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0">
          <CircleProgress value={attendanceRate} size={96} strokeWidth={8} stroke={standing.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold leading-none tracking-tight text-[#111] dark:text-white">
              {attendanceRate}
              <span className="text-xs font-bold">%</span>
            </p>
            <p className={`mt-1 text-[10px] font-semibold ${muted}`}>
              {attendanceCount}/{attendanceTotal}
            </p>
          </div>
        </div>

        <div className="w-full min-w-0 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${standing.bg} ${standing.color}`}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: standing.ring }} />
              {standing.text}
            </span>
            <span className={`text-xs ${muted}`}>
              {attendanceCount} of {attendanceTotal} service{attendanceTotal === 1 ? "" : "s"} attended
            </span>
          </div>

          {dots > 0 && (
            <ul aria-label={`${attendanceCount} of ${attendanceTotal} service days attended`} className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {Array.from({ length: dots }, (_, i) => (
                <li
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 ${
                    i < attendanceCount ? "border-transparent" : "border-[#E7CDD3] dark:border-white/15"
                  }`}
                  style={i < attendanceCount ? { backgroundColor: standing.ring } : undefined}
                />
              ))}
            </ul>
          )}

          <div className={`flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] sm:justify-start ${muted}`}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarCheck size={13} className="shrink-0 opacity-70" aria-hidden="true" />
              {attendanceTotal > 0 ? `${attendanceTotal} service days this month (Sun & Wed)` : "No services scheduled this month yet"}
            </span>
            {daysSinceLast !== null && daysSinceLast <= 60 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={13} className="shrink-0 opacity-70" aria-hidden="true" />
                Last attended {relativeTime(lastServiceDate as string).toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
