"use client";

import { motion } from "framer-motion";
import { Building2, Church, MessageCircle, Paperclip, Users, type LucideIcon } from "lucide-react";
import { useApproveReport, type ReportRow } from "@/lib/api/status-reports";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import ReportStatusBadge from "@/components/dashboard/reports/ReportStatusBadge";
import { toPlainText } from "@/components/dashboard/reports/ReportEditor";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

const ACCENT: Record<ReportRow["status"], string> = {
  DRAFT: "from-gray-300 to-gray-300 dark:from-white/20 dark:to-white/20",
  SUBMITTED: "from-sky-400 to-sky-500",
  APPROVED: "from-emerald-400 to-emerald-500",
  NEEDS_CORRECTION: "from-amber-400 to-amber-500",
};

/** One audit-queue report, sized for a 3-up grid. A thin gradient accent bar
 * carries the status color (instead of a left rule, so it reads distinctly
 * from the author-facing ReportCard) and a quick Approve action sits right on
 * the card — reviewers shouldn't have to open every submitted report just to
 * clear the easy ones. Full text, the comment thread, and "request a
 * correction" live in the review drawer this opens. */
export default function AuditReportCard({ report, index = 0, onOpen }: { report: ReportRow; index?: number; onOpen: () => void }) {
  const approve = useApproveReport(report.id);
  const scopeLabel = report.scope === "PASTOR" ? "Pastoral" : report.department ? report.department.name : report.unit?.name ?? "—";
  const ScopeIcon: LucideIcon = report.scope === "PASTOR" ? Church : report.department ? Building2 : Users;

  async function quickApprove(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await approve.mutateAsync();
      showToast.success("Report approved");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't approve report"));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/[0.04] dark:border-white/10 dark:bg-[#1c1c1e] dark:hover:shadow-black/20"
    >
      <div className={`h-1 w-full bg-gradient-to-r ${ACCENT[report.status]}`} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={report.submittedBy?.name ?? "Unknown"} photoUrl={report.submittedBy?.photoUrl ?? null} px={30} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white">{report.submittedBy?.name ?? "Unknown"}</p>
              <p className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-white/40">
                <ScopeIcon size={10} /> {scopeLabel}
              </p>
            </div>
          </div>
          <ReportStatusBadge status={report.status} />
        </div>

        <h3 className="mt-3.5 line-clamp-1 break-words text-[15px] font-bold leading-snug text-gray-900 dark:text-white">{report.title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 break-words text-[13px] leading-relaxed text-gray-500 dark:text-white/50">
          {toPlainText(report.content)}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] font-medium text-gray-400 dark:border-white/[0.06] dark:text-white/30">
          <span>{fmt(report.createdAt)}</span>
          <span className="flex items-center gap-2.5">
            {!!report.attachmentUrl && <Paperclip size={11} />}
            {report.commentCount > 0 && (
              <span className="inline-flex items-center gap-1"><MessageCircle size={11} /> {report.commentCount}</span>
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {report.status === "SUBMITTED" && (
            <button
              type="button"
              onClick={quickApprove}
              disabled={approve.isPending}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {approve.isPending ? "Approving…" : "Approve"}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className={`inline-flex items-center justify-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-600 transition-colors group-hover:border-[#87102C]/25 group-hover:text-[#87102C] dark:border-white/10 dark:text-white/60 dark:group-hover:border-[#e8768a]/25 dark:group-hover:text-[#e8768a] ${
              report.status === "SUBMITTED" ? "" : "flex-1"
            }`}
          >
            Review
          </button>
        </div>
      </div>
    </motion.div>
  );
}
