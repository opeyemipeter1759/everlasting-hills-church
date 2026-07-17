import type { MemberHomeProps } from "./types";
import { card, hdrBdr, kicker, cardTitle, muted } from "./tokens";
import { standingLabel } from "./helpers";
import { CircleProgress } from "./Primitives";

export function WarmAttendanceStat({ attendanceRate, attendanceCount, lastServiceDate, recentServices }: {
  attendanceRate: number;
  attendanceCount: number;
  lastServiceDate: string | null;
  recentServices: MemberHomeProps["recentServices"];
}) {
  const standing = standingLabel(attendanceRate);

  const sundaysAttended = recentServices.filter(
    (s) => new Date(s.scheduledAt).getDay() === 0
  ).length;
  const sundayNarrative = sundaysAttended > 0
    ? `You attended ${sundaysAttended} of the last 6 Sundays`
    : null;

  const daysSinceLast = lastServiceDate
    ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / 86_400_000)
    : null;

  return (
    <section className={card}>
      <div className={`${hdrBdr} px-5 py-4`}>
        <p className={kicker}>My Journey</p>
        <h3 className={cardTitle}>Attendance</h3>
      </div>
      <div className="flex-1 p-5 flex flex-col items-center gap-3 text-center">
        {/* Large ring with % inside */}
        <div className="relative my-1">
          <CircleProgress value={attendanceRate} size={88} />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xl font-black text-[#111] dark:text-white leading-none">
              {attendanceRate}<span className="text-xs font-bold">%</span>
            </p>
          </div>
        </div>
        <div className="space-y-0.5">
          <p className={`text-xs ${muted} leading-relaxed`}>
            {attendanceCount > 0
              ? `${attendanceCount} service${attendanceCount !== 1 ? "s" : ""} attended`
              : "No attendance recorded yet"}
          </p>
          {sundayNarrative && (
            <p className={`text-[11px] ${muted} opacity-80`}>{sundayNarrative}</p>
          )}
          {daysSinceLast !== null && daysSinceLast <= 60 && (
            <p className={`text-[11px] ${muted} opacity-70`}>
              Last here {daysSinceLast === 0 ? "today" : daysSinceLast === 1 ? "yesterday" : `${daysSinceLast} days ago`}
            </p>
          )}
          <p className={`text-[11px] font-semibold mt-1 ${standing.color}`}>{standing.text}</p>
        </div>
      </div>
    </section>
  );
}
