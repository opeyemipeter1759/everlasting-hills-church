import { useEffect } from "react";
import { BookOpen, Compass, Cross, Crown, Flame, Shield, Star } from "lucide-react";
import type { MemberHomeProps, StreakState, TaskRequirement } from "./types";
import { card, hdrBdr, kicker, cardTitle, muted } from "./tokens";
import { fmtDate, fmtTime } from "./helpers";
import { CircleProgress } from "./Primitives";
import { showToast } from "@/components/ui/toast/toast";

// One brand family throughout (pink → maroon), deepening tier by tier, instead of a
// different hue per rank — matches every other ring/badge/button on this page.
const RANK_TIERS = [
  { minLevel: 1, title: "Seeker", icon: Compass, ring: "#FFB3C1" },
  { minLevel: 4, title: "Believer", icon: Cross, ring: "#F49AAE" },
  { minLevel: 8, title: "Disciple", icon: BookOpen, ring: "#e8768a" },
  { minLevel: 12, title: "Faithful", icon: Shield, ring: "#C85C79" },
  { minLevel: 16, title: "Overcomer", icon: Flame, ring: "#A83A5C" },
  { minLevel: 20, title: "Champion", icon: Crown, ring: "#87102C" },
  { minLevel: 25, title: "Legend", icon: Star, ring: "#6E0C24" },
] as const;

const RANK_BG = "bg-[#FFE8ED] dark:bg-[#87102C]/15";
const RANK_TEXT = "text-[#87102C] dark:text-[#e8768a]";

function remainingLabel(task: TaskRequirement, progress: TaskRequirement): string {
  const remain = {
    attendance: Math.max(0, task.attendance - progress.attendance),
    sermon: Math.max(0, task.sermon - progress.sermon),
    course: Math.max(0, task.course - progress.course),
  };
  const parts: string[] = [];
  if (remain.attendance > 0) parts.push(`attend ${remain.attendance} more service${remain.attendance !== 1 ? "s" : ""}`);
  if (remain.sermon > 0) parts.push(`listen to ${remain.sermon} more sermon${remain.sermon !== 1 ? "s" : ""}`);
  if (remain.course > 0) parts.push(`complete ${remain.course} more course${remain.course !== 1 ? "s" : ""}`);
  if (parts.length === 0) return "Ready to level up! 🎉";
  const joined = parts.join(" and ");
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)} to level up`;
}

export function WarmStreakStat({ memberDisplayId, streak, coursesCompleted, sermonsCompleted, nextService, ministryUnit }: {
  memberDisplayId: string;
  streak: StreakState;
  coursesCompleted: number;
  sermonsCompleted: number;
  nextService: MemberHomeProps["nextService"];
  ministryUnit?: MemberHomeProps["ministryUnit"];
}) {
  const rank = RANK_TIERS.find((r) => r.title === streak.title) ?? RANK_TIERS[0];

  const activeKeys = (["attendance", "sermon", "course"] as const).filter((k) => streak.task[k] > 0);
  const fractions = activeKeys.map((k) => Math.min(1, streak.progress[k] / streak.task[k]));
  const progressPct = fractions.length ? Math.round((fractions.reduce((a, b) => a + b, 0) / fractions.length) * 100) : 0;

  // Celebrate a level-up the next time it's noticed (e.g. finishing a course while off
  // the dashboard) — never on the very first-ever visit, only on a real increase.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `streak-level-seen:${memberDisplayId}`;
    const seen = Number(window.localStorage.getItem(key) ?? "0");
    if (seen > 0 && streak.level > seen) {
      showToast.success(`🎉 Level up! You're now a ${streak.title}`);
    }
    if (streak.level !== seen) window.localStorage.setItem(key, String(streak.level));
  }, [memberDisplayId, streak.level, streak.title]);

  return (
    <section className={card}>
      <div className={`${hdrBdr} px-5 py-4`}>
        <p className={kicker}>My Journey</p>
        <h3 className={cardTitle}>Streak</h3>
      </div>
      <div className="flex-1 p-5 flex flex-col items-center gap-3">
        {/* Ring with mascot icon + level inside */}
        <div className="relative">
          <CircleProgress value={progressPct} size={104} strokeWidth={8} stroke={rank.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${rank.ring}1f` }}
            >
              <rank.icon size={18} style={{ color: rank.ring }} strokeWidth={2.25} />
            </span>
            <p className={`text-[10px] font-bold mt-1.5 ${muted}`}>Level {streak.level}</p>
          </div>
        </div>

        {/* Rank badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${RANK_BG} ${RANK_TEXT}`}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rank.ring }} />
          {rank.title}
        </span>

        {/* Stages passed — one flame per rank tier, lit up once cleared */}
        <div className="w-full flex items-center justify-between" title={`Stage ${RANK_TIERS.findIndex((t) => t.title === rank.title) + 1} of ${RANK_TIERS.length}`}>
          {RANK_TIERS.map((tier) => {
            const reached = streak.level >= tier.minLevel;
            const isCurrent = tier.title === streak.title;
            return (
              <span
                key={tier.title}
                className={`flex items-center justify-center rounded-full flex-shrink-0 transition-all ${isCurrent ? "h-8 w-8" : "h-7 w-7"} ${reached ? "" : "bg-gray-100 dark:bg-white/[0.06]"}`}
                style={reached ? { backgroundColor: `${tier.ring}1a`, boxShadow: isCurrent ? `0 0 0 2px ${tier.ring}` : undefined } : undefined}
              >
                <Flame
                  size={isCurrent ? 16 : 14}
                  className={reached ? "" : "text-gray-300 dark:text-white/15"}
                  style={reached ? { color: tier.ring } : undefined}
                  fill={reached ? tier.ring : "none"}
                  fillOpacity={reached ? 0.85 : 1}
                />
              </span>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-center text-[#111] dark:text-white">{remainingLabel(streak.task, streak.progress)}</p>

        {(coursesCompleted > 0 || sermonsCompleted > 0) && (
          <p className={`text-[11px] text-center ${muted}`}>
            Lifetime: {coursesCompleted} course{coursesCompleted !== 1 ? "s" : ""} · {sermonsCompleted} sermon{sermonsCompleted !== 1 ? "s" : ""}
          </p>
        )}

        {(ministryUnit?.nextServingDate || nextService) && (
          <div className="w-full pt-3 mt-1 border-t border-[#E7CDD3]/50 dark:border-white/[0.07]">
            {ministryUnit?.nextServingDate ? (
              <>
                <p className={`${kicker} mb-1`}>Serving Next</p>
                <p className="text-xs font-semibold text-[#111] dark:text-white line-clamp-1">{ministryUnit.name}</p>
                <p className={`text-[11px] ${muted} mt-0.5`}>
                  {fmtDate(ministryUnit.nextServingDate, { weekday: "short", day: "numeric", month: "short" })}
                </p>
              </>
            ) : nextService ? (
              <>
                <p className={`${kicker} mb-1`}>Next Service</p>
                <p className="text-xs font-semibold text-[#111] dark:text-white line-clamp-1">{nextService.name}</p>
                <p className={`text-[11px] ${muted} mt-0.5`}>
                  {fmtDate(nextService.scheduledAt, { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}{fmtTime(nextService.scheduledAt)}
                </p>
              </>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
