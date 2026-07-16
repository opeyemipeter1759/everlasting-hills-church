import type { AbsenteeRiskCategory, FollowUpOutcome, FollowUpSourceType, FollowUpStage } from "@/types/follow-up";

const STAGE_CONFIG: Record<FollowUpStage, { label: string; className: string }> = {
  UNASSIGNED: {
    label: "Unassigned",
    className: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 border-gray-200 dark:border-white/[0.09]",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  },
  AWAITING_REVIEW: {
    label: "Awaiting Review",
    className: "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  REOPENED: {
    label: "Reopened",
    className: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  },
};

export function StagePill({ stage }: { stage: FollowUpStage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const SOURCE_CONFIG: Record<FollowUpSourceType, { label: string; className: string }> = {
  FIRST_TIMER: {
    label: "First-Timer",
    className: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
  },
  ABSENTEE: {
    label: "Absentee",
    className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  },
};

export function SourceTypePill({ type }: { type: FollowUpSourceType }) {
  const cfg = SOURCE_CONFIG[type];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// Matches AtRiskPanel's color convention (components/dashboard/admin/attendance/AtRiskPanel.tsx).
const RISK_CONFIG: Record<AbsenteeRiskCategory, { label: string; className: string }> = {
  CONSECUTIVE_ABSENCES: {
    label: "Consecutive Absences",
    className: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
  },
  NEVER_ATTENDED: {
    label: "Never Attended",
    className: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  },
  BELOW_50_PERCENT: {
    label: "Below 50% Rate",
    className: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  },
};

export function RiskCategoryPill({ category }: { category: AbsenteeRiskCategory }) {
  const cfg = RISK_CONFIG[category];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const OUTCOME_CONFIG: Record<FollowUpOutcome, { label: string; className: string }> = {
  REACHABLE: {
    label: "Reachable",
    className: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
  },
  UNREACHABLE: {
    label: "Unreachable",
    className: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 border-gray-200 dark:border-white/[0.09]",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    className: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 border-gray-200 dark:border-white/[0.09]",
  },
  TRAVEL: {
    label: "Travel",
    className: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  },
  CAME_FOR_VISITING: {
    label: "Came for Visiting",
    className: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
  },
  HAVE_A_CHURCH: {
    label: "Have a Church",
    className: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 border-gray-200 dark:border-white/[0.09]",
  },
  WANT_TO_BE_MEMBER: {
    label: "Want to be a Member",
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  // Legacy — no longer logged, kept so old entries still render something sensible.
  BECAME_MEMBER: {
    label: "Became a Member",
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  RETURNED: {
    label: "Returned to Church",
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
};

export function OutcomePill({ outcome }: { outcome: FollowUpOutcome }) {
  const cfg = OUTCOME_CONFIG[outcome];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
