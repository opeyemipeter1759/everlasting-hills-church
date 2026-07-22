"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, Download, MessageCircle, Paperclip, PenLine, Send, Trash2 } from "lucide-react";
import { useUpdateReport, useDeleteReport, type ReportRow } from "@/lib/api/status-reports";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import ReportStatusBadge from "./ReportStatusBadge";
import { exportReportDocx } from "./exportReportDocx";
import { toPlainText } from "./ReportEditor";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

const ICON: Record<ReportRow["status"], { bg: string; text: string; Icon: typeof Clock }> = {
  DRAFT: { bg: "bg-gray-100 dark:bg-white/10", text: "text-gray-500 dark:text-white/50", Icon: PenLine },
  SUBMITTED: { bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", Icon: Clock },
  APPROVED: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
  NEEDS_CORRECTION: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", Icon: AlertTriangle },
};

/** One report as a card — three to a row, styled to the same bar as the editor
 * page: quiet borders, restrained brand color, real typographic hierarchy,
 * a status icon rather than a loud color block. Whole card is clickable
 * (opens the report); the action row underneath stops that propagation. */
export default function ReportCard({ report, index = 0, viewHref }: { report: ReportRow; index?: number; viewHref: string }) {
  const router = useRouter();
  const update = useUpdateReport(report.id);
  const del = useDeleteReport();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const icon = ICON[report.status];
  const target = report.department?.name ?? report.unit?.name ?? null;

  async function quickSend(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await update.mutateAsync({
        title: report.title,
        content: report.content,
        attachmentUrl: report.attachmentUrl ?? undefined,
        attachmentName: report.attachmentName ?? undefined,
        status: "SUBMITTED",
      });
      showToast.success("Report sent");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't send report"));
    }
  }

  async function handleExport(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await exportReportDocx(report);
    } catch {
      showToast.error("Couldn't export report");
    }
  }

  async function handleDelete() {
    try {
      await del.mutateAsync(report.id);
      showToast.success("Report deleted");
      setConfirmDelete(false);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete report"));
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
        whileHover={{ y: -3 }}
        onClick={() => router.push(viewHref)}
        className="flex cursor-pointer flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5 shadow-sm transition-shadow hover:border-[#87102C]/25 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:border-[#e8768a]/25 dark:hover:shadow-black/20"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${icon.bg}`}>
            <icon.Icon size={16} className={icon.text} />
          </span>
          <ReportStatusBadge status={report.status} />
        </div>

        <h3 className="mt-3.5 line-clamp-1 break-words text-[15px] font-bold leading-snug text-gray-900 dark:text-white">{report.title}</h3>
        <p className="mt-1.5 line-clamp-3 flex-1 break-words text-[13px] leading-relaxed text-gray-500 dark:text-white/50">{toPlainText(report.content)}</p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/[0.06] pt-3 text-[11px] font-medium text-gray-400 dark:text-white/30">
          <span className="truncate">{target ? `${target} · ${fmt(report.createdAt)}` : fmt(report.createdAt)}</span>
          <span className="flex flex-shrink-0 items-center gap-2.5">
            {!!report.attachmentUrl && <Paperclip size={11} />}
            {report.commentCount > 0 && (
              <span className="inline-flex items-center gap-1"><MessageCircle size={11} /> {report.commentCount}</span>
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {report.status === "DRAFT" && (
            <button
              type="button"
              onClick={quickSend}
              disabled={update.isPending}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#87102C] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#6E0C24] disabled:opacity-50"
            >
              <Send size={12} /> {update.isPending ? "Sending…" : "Send"}
            </button>
          )}
          <button type="button" onClick={handleExport} title="Export as Word document" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white">
            <Download size={14} />
          </button>
          {report.status !== "APPROVED" && (
            <button type="button" onClick={() => setConfirmDelete(true)} title="Delete" className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this report?"
        description="This can't be undone."
        confirmLabel="Delete report"
        tone="danger"
        loading={del.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
