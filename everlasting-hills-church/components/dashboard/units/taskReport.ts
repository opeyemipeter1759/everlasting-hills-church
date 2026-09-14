import { CheckCircle2, CircleDot, OctagonAlert, type LucideIcon } from "lucide-react";
import type { UnitTaskReportOutcome, UnitTaskReportStatus } from "@/types";

export const OUTCOME_META: Record<UnitTaskReportOutcome, { label: string; hint: string; icon: LucideIcon; cls: string }> = {
  COMPLETED: {
    label: "Completed",
    hint: "The task is finished — this closes it",
    icon: CheckCircle2,
    cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  IN_PROGRESS: {
    label: "In progress",
    hint: "Work is underway; this is a check-in",
    icon: CircleDot,
    cls: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  },
  BLOCKED: {
    label: "Blocked",
    hint: "Something is stopping you — say what in Challenges",
    icon: OctagonAlert,
    cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
};

export const REPORT_STATUS_META: Record<UnitTaskReportStatus, { label: string; cls: string }> = {
  SUBMITTED: { label: "Awaiting review", cls: "bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20" },
  ACKNOWLEDGED: { label: "Acknowledged", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  NEEDS_REVISION: { label: "Needs revision", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
