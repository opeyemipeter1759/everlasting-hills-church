"use client";

import { useState } from "react";
import { ChevronDown, FileText, Send } from "lucide-react";
import { useReport, useUpdateReport, useAddReportComment, type ReportRow } from "@/lib/api/status-reports";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import ReportStatusBadge from "./ReportStatusBadge";
import ReportForm, { type ReportFormValues } from "./ReportForm";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

/** One report row in "my reports" — expands to show comments (and, when the
 * report needs correction, lets the author edit + resubmit it inline). */
export default function ReportListItem({ report }: { report: ReportRow }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");

  const detail = useReport(open ? report.id : null);
  const update = useUpdateReport(report.id);
  const addComment = useAddReportComment(report.id);

  async function handleResubmit(values: ReportFormValues) {
    try {
      await update.mutateAsync(values);
      showToast.success("Report resubmitted");
      setEditing(false);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't resubmit report"));
    }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync(comment.trim());
      setComment("");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't post comment"));
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{report.title}</p>
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {fmt(report.createdAt)}{report.commentCount > 0 ? ` · ${report.commentCount} comment${report.commentCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-3 space-y-3">
          {editing ? (
            <ReportForm
              initial={{ title: report.title, content: report.content, attachmentUrl: report.attachmentUrl ?? "", attachmentName: report.attachmentName ?? "" }}
              submitLabel="Resubmit report"
              pending={update.isPending}
              onSubmit={handleResubmit}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-white/80">{report.content}</p>
              {report.attachmentUrl && (
                <a href={report.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline">
                  <FileText size={13} /> {report.attachmentName || "Attachment"}
                </a>
              )}
              {report.status === "NEEDS_CORRECTION" && (
                <button type="button" onClick={() => setEditing(true)} className="block text-xs font-bold text-[#87102C] dark:text-[#e8768a] hover:underline">
                  Edit &amp; resubmit
                </button>
              )}
            </>
          )}

          {/* Comments */}
          {detail.data && detail.data.comments.length > 0 && (
            <div className="space-y-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
              {detail.data.comments.map((c) => (
                <div key={c.id} className={`rounded-lg px-3 py-2 text-xs ${c.isReviewer ? "bg-amber-50 dark:bg-amber-500/10" : "bg-gray-50 dark:bg-white/5"}`}>
                  <p className="mb-0.5 font-bold text-gray-700 dark:text-white/80">
                    {c.author?.name ?? "Unknown"} {c.isReviewer && <span className="font-normal text-amber-600 dark:text-amber-400">· Reviewer</span>}
                  </p>
                  <p className="text-gray-600 dark:text-white/70">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reply…"
              className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            />
            <button
              type="button"
              onClick={handleComment}
              disabled={!comment.trim() || addComment.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6E0C24] disabled:opacity-40"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
