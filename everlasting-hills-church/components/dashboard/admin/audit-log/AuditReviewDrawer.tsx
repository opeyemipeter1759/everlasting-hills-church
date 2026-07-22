"use client";

import { useState } from "react";
import { Building2, Church, CheckCircle2, FileText, Send, Users, XCircle, type LucideIcon } from "lucide-react";
import { useReport, useApproveReport, useRequestCorrection, useAddReportComment, type ReportRow } from "@/lib/api/status-reports";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import Drawer from "@/components/ui/overlay/Drawer";
import ReportStatusBadge from "@/components/dashboard/reports/ReportStatusBadge";
import { PROSE_CLASSES } from "@/components/dashboard/reports/ReportEditor";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

/** Reports written before the rich-text editor shipped are plain text with no
 * tags — render those with the old whitespace-preserving fallback. */
function isLikelyHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/** Full review surface for one audit-queue report — opened from AuditReportCard.
 * Everything the previous inline-accordion held (full text, comment thread,
 * approve / request-correction, reply box) lives here now, in a drawer rather
 * than eating vertical space in a 3-up grid. */
export default function AuditReviewDrawer({ report, onClose }: { report: ReportRow | null; onClose: () => void }) {
  const [correcting, setCorrecting] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [comment, setComment] = useState("");

  const detail = useReport(report?.id ?? null);
  const approve = useApproveReport(report?.id ?? "");
  const requestCorrection = useRequestCorrection(report?.id ?? "");
  const addComment = useAddReportComment(report?.id ?? "");

  async function handleApprove() {
    try {
      await approve.mutateAsync();
      showToast.success("Report approved");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't approve report"));
    }
  }

  async function handleRequestCorrection() {
    if (!correctionNote.trim()) return;
    try {
      await requestCorrection.mutateAsync(correctionNote.trim());
      showToast.success("Correction requested");
      setCorrectionNote("");
      setCorrecting(false);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't request correction"));
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

  const scopeLabel = report ? (report.scope === "PASTOR" ? "Pastoral" : report.department ? report.department.name : report.unit?.name ?? "—") : "";
  const ScopeIcon: LucideIcon = report?.scope === "PASTOR" ? Church : report?.department ? Building2 : Users;
  const comments = detail.data?.comments ?? [];

  return (
    <Drawer open={!!report} onClose={onClose} maxWidth="lg">
      {!report ? null : (
        <>
      {/* Header */}
      <div className="border-b border-gray-100 px-6 pb-5 pt-7 dark:border-white/[0.06]">
        <ReportStatusBadge status={report.status} />
        <h2 className="mt-3 break-words text-xl font-bold leading-snug text-gray-900 dark:text-white">{report.title}</h2>
        <div className="mt-3 flex items-center gap-2.5">
          <Avatar name={report.submittedBy?.name ?? "Unknown"} photoUrl={report.submittedBy?.photoUrl ?? null} px={30} />
          <div>
            <p className="text-[13px] font-bold text-gray-800 dark:text-white/90">{report.submittedBy?.name ?? "Unknown"}</p>
            <p className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-white/40">
              <ScopeIcon size={10} /> {scopeLabel} · {fmt(report.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-5 px-6 py-6">
        {isLikelyHtml(report.content) ? (
          <div className={`text-gray-800 dark:text-white/85 ${PROSE_CLASSES}`} dangerouslySetInnerHTML={{ __html: report.content }} />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-800 dark:text-white/85">{report.content}</p>
        )}

        {report.attachmentUrl && (
          <a
            href={report.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]"
          >
            <FileText size={13} /> {report.attachmentName || "Attachment"}
          </a>
        )}

        {/* Review actions */}
        {report.status !== "APPROVED" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approve.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> {approve.isPending ? "Approving…" : "Approve"}
            </button>
            {!correcting && (
              <button
                type="button"
                onClick={() => setCorrecting(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10"
              >
                <XCircle size={14} /> Send correction
              </button>
            )}
          </div>
        )}

        {correcting && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-500/20 dark:bg-amber-500/[0.04]">
            <textarea
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              rows={3}
              placeholder="What needs to be corrected?"
              className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-amber-500/20 dark:bg-white/5 dark:text-white"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestCorrection}
                disabled={!correctionNote.trim() || requestCorrection.isPending}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-40"
              >
                {requestCorrection.isPending ? "Sending…" : "Send correction"}
              </button>
              <button type="button" onClick={() => setCorrecting(false)} className="text-xs font-semibold text-gray-500 hover:underline">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
            Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </p>

          {comments.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-white/30">No comments yet.</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className={`rounded-lg px-3 py-2 text-xs ${c.isReviewer ? "bg-amber-50 dark:bg-amber-500/10" : "bg-gray-50 dark:bg-white/5"}`}>
                  <p className="mb-0.5 font-bold text-gray-700 dark:text-white/80">
                    {c.author?.name ?? "Unknown"} {c.isReviewer && <span className="font-normal text-amber-600 dark:text-amber-400">· Reviewer</span>}
                  </p>
                  <p className="text-gray-600 dark:text-white/70">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
      </div>
        </>
      )}
    </Drawer>
  );
}
