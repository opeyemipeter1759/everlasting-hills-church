import { ClipboardList, UserPlus, PhoneCall, Hourglass } from "lucide-react";
import type { FollowUpEntry } from "@/types/follow-up";

interface PipelineStatsProps {
  entries: FollowUpEntry[];
}

// Church-wide totals — the same numbers for every viewer, team member through admin.
export function PipelineStats({ entries }: PipelineStatsProps) {
  const active = entries.filter((e) => e.stage !== "CONFIRMED");
  const unassigned = active.filter((e) => e.stage === "UNASSIGNED").length;
  const inProgress = active.filter((e) => e.stage === "ASSIGNED" || e.stage === "IN_PROGRESS" || e.stage === "REOPENED").length;
  const awaitingReview = active.filter((e) => e.stage === "AWAITING_REVIEW").length;

  const stats = [
    {
      label: "Total in Pipeline",
      value: active.length,
      icon: ClipboardList,
      iconBg: "bg-[#FFE8ED] dark:bg-[#87102C]/25",
      iconColor: "text-[#87102C] dark:text-[#FFB3C1]",
    },
    {
      label: "Unassigned",
      value: unassigned,
      icon: UserPlus,
      iconBg: "bg-gray-100 dark:bg-white/10",
      iconColor: "text-gray-500 dark:text-white/50",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: PhoneCall,
      iconBg: "bg-amber-50 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Awaiting Review",
      value: awaitingReview,
      icon: Hourglass,
      iconBg: "bg-violet-50 dark:bg-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5
            shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none"
        >
          <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-4`}>
            <s.icon size={17} className={s.iconColor} aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-[#111] dark:text-white leading-none">{s.value}</p>
          <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1.5 font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
