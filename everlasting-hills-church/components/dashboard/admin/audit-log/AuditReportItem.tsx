"use client";

import { useState } from "react";
import { Building2, CheckCircle2, ChevronDown, FileText, Send, Users, XCircle } from "lucide-react";
import { useReport, useApproveReport, useRequestCorrection, useAddReportComment, type ReportRow } from "@/lib/api/status-reports";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import ReportStatusBadge from "@/components/dashboard/reports/ReportStatusBadge";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export default function AuditReportItem({ report }: { report: ReportRow }) {
  const [open, setOpen] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [comment, setComment] = useState("");

  const detail = useReport(open ? report.id : null);
  const approve = useApproveReport(report.id);
  const requestCorrection = useRequestCorrection(report.id);
  const addComment = useAddReportComment(report.id);

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

  const scopeLabel = report.department ? report.department.name : report.unit?.name ?? "—";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={report.submittedBy?.name ?? "Unknown"} photoUrl={report.submittedBy?.photoUrl ?? null} px={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{report.title}</p>
              <ReportStatusBadge status={report.status} />
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400">
              {report.department ? <Building2 size={11} /> : <Users size={11} />} {scopeLabel} · {report.submittedBy?.name ?? "Unknown"} · {fmt(report.createdAt)}
            </p>
          </div>
        </div>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] px-5 py-4 space-y-4">
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-white/80">{report.content}</p>
          {report.attachmentUrl && (
            <a href={report.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline">
              <FileText size={13} /> {report.attachmentName || "Attachment"}
            </a>
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

          {/* Review actions */}
          {report.status !== "APPROVED" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={approve.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> Approve
              </button>
              {!correcting && (
                <button
                  type="button"
                  onClick={() => setCorrecting(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                >
                  <XCircle size={14} /> Send correction
                </button>
              )}
            </div>
          )}

          {correcting && (
            <div className="space-y-2 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.04] p-3">
              <textarea
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                rows={2}
                placeholder="What needs to be corrected?"
                className="w-full resize-none rounded-lg border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-white/5 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
                <button type="button" onClick={() => setCorrecting(false)} className="text-xs font-semibold text-gray-500 hover:underline">Cancel</button>
              </div>
            </div>
          )}

          {/* General comment */}
          <div className="flex items-center gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
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
