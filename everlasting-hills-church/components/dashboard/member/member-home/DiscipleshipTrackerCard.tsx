import { motion } from "framer-motion";
import { Award, CheckCircle2 } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { muted } from "./tokens";
import { fmtShortDate } from "./helpers";
import { PanelCard } from "./Primitives";

export function DiscipleshipTrackerCard({ milestones }: {
  milestones: MemberHomeProps["discipleshipMilestones"];
}) {
  const defaultItems: Array<{ label: string; completedAt: string | null }> = [
    { label: "Water Baptism", completedAt: null },
    { label: "Membership Class", completedAt: null },
    { label: "Leadership Training", completedAt: null },
  ];
  const items = (milestones && milestones.length > 0) ? milestones : defaultItems;
  const doneCount = items.filter((m) => m.completedAt).length;

  return (
    <PanelCard
      kicker="Discipleship"
      title="Growth Milestones"
      icon={Award}
      action={<span className={`text-xs font-bold ${muted} tabular-nums`}>{doneCount}/{items.length}</span>}
    >
      <div className="h-1.5 rounded-full bg-[#E7CDD3]/50 dark:bg-white/[0.07] mb-5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / items.length) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
      <div className="space-y-2.5">
        {items.map((m, i) => (
          <div
            key={i}
            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border ${
              m.completedAt
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20"
                : "bg-gray-50 dark:bg-white/[0.03] border-[#E7CDD3]/50 dark:border-white/[0.07]"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.completedAt ? "bg-emerald-500" : "bg-[#E7CDD3]/60 dark:bg-white/10"
            }`}>
              {m.completedAt
                ? <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />
                : <span className="text-[10px] font-bold text-[#8a7e80] dark:text-white/40">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${m.completedAt ? "text-emerald-700 dark:text-emerald-400" : "text-[#111] dark:text-white"}`}>
                {m.label}
              </p>
              {m.completedAt && (
                <p className={`text-[10px] ${muted}`}>Completed {fmtShortDate(m.completedAt)}</p>
              )}
            </div>
            {!m.completedAt && (
              <span className={`text-[11px] font-medium ${muted} flex-shrink-0`}>Pending</span>
            )}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
