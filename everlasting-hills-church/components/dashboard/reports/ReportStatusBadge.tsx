import { AlertTriangle, CheckCircle2, Clock, PenLine } from "lucide-react";
import type { ReportStatus } from "@/lib/api/status-reports";

const CONFIG: Record<ReportStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  DRAFT: {
    label: "Draft",
    cls: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/15",
    Icon: PenLine,
  },
  SUBMITTED: {
    label: "Submitted",
    cls: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-500/20",
    Icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20",
    Icon: CheckCircle2,
  },
  NEEDS_CORRECTION: {
    label: "Needs correction",
    cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20",
    Icon: AlertTriangle,
  },
};

export default function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const { label, cls, Icon } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${cls}`}>
      <Icon size={10} /> {label}
    </span>
  );
}
