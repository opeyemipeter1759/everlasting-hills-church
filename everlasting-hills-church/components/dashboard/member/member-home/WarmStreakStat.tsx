import { motion } from "framer-motion";
import { Zap, Award, Star } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { card, hdrBdr, kicker, cardTitle, muted } from "./tokens";
import { streakLabel, fmtDate, fmtTime } from "./helpers";

export function WarmStreakStat({ streakWeeks, nextService, ministryUnit }: {
  streakWeeks: number;
  nextService: MemberHomeProps["nextService"];
  ministryUnit?: MemberHomeProps["ministryUnit"];
}) {
  const streak = streakLabel(streakWeeks);

  const milestones = [
    { wks: 4,  label: "4-Week Faithful",  color: "text-sky-600 dark:text-sky-400",    bg: "bg-sky-50 dark:bg-sky-500/10",    border: "border-sky-200/60 dark:border-sky-500/20" },
    { wks: 8,  label: "8-Week Committed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200/60 dark:border-emerald-500/20" },
    { wks: 12, label: "12-Week Champion", color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-200/60 dark:border-amber-500/20" },
  ];
  const earnedMilestone = [...milestones].reverse().find((m) => streakWeeks >= m.wks);

  return (
    <section className={card}>
      <div className={`${hdrBdr} px-5 py-4`}>
        <p className={kicker}>My Journey</p>
        <h3 className={cardTitle}>Streak</h3>
      </div>
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-3xl font-black text-[#111] dark:text-white leading-none">
              {streakWeeks}<span className="text-base font-bold ml-1">Wk{streakWeeks !== 1 ? "s" : ""}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${streak.dot}`} />
              <p className={`text-[11px] font-semibold ${muted}`}>{streak.text}</p>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200/60 dark:border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-amber-500" />
          </div>
        </div>

        {earnedMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border ${earnedMilestone.bg} ${earnedMilestone.border}`}
          >
            <Award size={16} className={earnedMilestone.color} />
            <p className={`text-[11px] font-bold ${earnedMilestone.color}`}>{earnedMilestone.label}</p>
            <Star size={10} className={`ml-auto ${earnedMilestone.color} opacity-60`} fill="currentColor" />
          </motion.div>
        )}

        {(ministryUnit?.nextServingDate || nextService) && (
          <div className="pt-4 border-t border-[#E7CDD3]/50 dark:border-white/[0.07]">
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
