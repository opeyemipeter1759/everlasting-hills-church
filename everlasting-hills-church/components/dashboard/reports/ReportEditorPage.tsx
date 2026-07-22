"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, Lock, Pencil, Send, Trash2 } from "lucide-react";
import {
  useReport,
  useCreateReport,
  useUpdateReport,
  useDeleteReport,
  useAddReportComment,
  type ReportScope,
  type WritableReportStatus,
} from "@/lib/api/status-reports";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import ReportStatusBadge from "./ReportStatusBadge";
import ReportEditor, { textLength, PROSE_CLASSES } from "./ReportEditor";
import ReportAttachmentUpload from "./ReportAttachmentUpload";
import { exportReportDocx } from "./exportReportDocx";
import ReportEditorSkeleton from "@/components/ui/skeleton/ReportEditorSkeleton";

interface Target {
  id: string;
  name: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

/** Reports written before the rich-text editor shipped are plain text with no
 * tags — render those with the old whitespace-preserving fallback. */
function isLikelyHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/** Full-page report create/view/edit — mirrors CourseEditorPage's mode pattern.
 * Never a modal, never an inline swap on the list page: this is a real route. */
export default function ReportEditorPage({
  mode,
  scope,
  targets = [],
  reportId,
  backHref,
}: {
  mode: "create" | "edit";
  scope: ReportScope;
  /** Department(s)/unit this section covers. Empty for scope="PASTOR". */
  targets?: Target[];
  reportId?: string;
  backHref: string;
}) {
  const router = useRouter();
  const { data: report } = useReport(mode === "edit" ? reportId : undefined);
  const create = useCreateReport();
  const update = useUpdateReport(reportId ?? "");
  const del = useDeleteReport();
  const addComment = useAddReportComment(reportId ?? "");

  const [editing, setEditing] = useState(mode === "create");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [targetId, setTargetId] = useState<string | undefined>(targets[0]?.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (mode === "edit" && report) {
      setTitle(report.title);
      setContent(report.content);
      setAttachmentUrl(report.attachmentUrl ?? "");
      setAttachmentName(report.attachmentName ?? "");
    }
  }, [mode, report]);

  const pending = create.isPending || update.isPending;
  const canSave = title.trim().length > 0 && textLength(content) >= 5 && !pending;
  const locked = report?.status === "APPROVED";
  const isDraftFlow = mode === "create" || report?.status === "DRAFT";

  async function saveAs(status: WritableReportStatus) {
    if (!canSave) return;
    try {
      if (mode === "create") {
        const created = await create.mutateAsync({
          scope,
          ...(scope === "DEPARTMENT" && targetId ? { departmentId: targetId } : {}),
          ...(scope === "UNIT" && targetId ? { unitId: targetId } : {}),
          title: title.trim(),
          content,
          attachmentUrl: attachmentUrl || undefined,
          attachmentName: attachmentName || undefined,
          status,
        });
        showToast.success(status === "DRAFT" ? "Draft saved" : "Report sent");
        router.push(`${backHref}/${created.id}`);
      } else {
        await update.mutateAsync({ title: title.trim(), content, attachmentUrl, attachmentName, status });
        showToast.success(status === "DRAFT" ? "Draft saved" : "Report sent");
        setEditing(false);
      }
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't save report"));
    }
  }

  /** Plain edit-in-place for an already-sent report — omits `status` so the
   * service's existing resubmit-on-correction / no-op-on-submitted logic applies. */
  async function saveChanges() {
    if (!canSave) return;
    try {
      await update.mutateAsync({ title: title.trim(), content, attachmentUrl, attachmentName });
      showToast.success("Report saved");
      setEditing(false);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't save report"));
    }
  }

  /** Send a draft as-is, without opening the editor. */
  async function quickSend() {
    if (!report) return;
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

  async function handleDelete() {
    if (!reportId) return;
    try {
      await del.mutateAsync(reportId);
      showToast.success("Report deleted");
      router.push(backHref);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete report"));
      setConfirmDelete(false);
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

  if (mode === "edit" && !report) {
    return <ReportEditorSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-8xl space-y-5">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} /> Back to reports
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-white/[0.06] px-6 pb-5 pt-7 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              {mode === "create" && targets.length > 1 && (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-bold text-gray-600 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}

              {editing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Report title"
                  className="w-full border-none bg-transparent p-0 text-2xl font-bold text-gray-900 dark:text-white placeholder:text-gray-300 focus:outline-none focus:ring-0"
                />
              ) : (
                <h1 className="break-words text-2xl font-bold leading-tight text-gray-900 dark:text-white">{report?.title}</h1>
              )}

              {mode === "edit" && report && (
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400 dark:text-white/40">
                  <ReportStatusBadge status={report.status} />
                  <span>{fmt(report.createdAt)}</span>
                  {report.updatedAt !== report.createdAt && <span>· edited {fmt(report.updatedAt)}</span>}
                </div>
              )}
            </div>

            {mode === "edit" && report && !editing && (
              <div className="flex flex-shrink-0 items-center gap-1">
                <button type="button" onClick={() => exportReportDocx(report)} title="Export as Word document" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white">
                  <Download size={15} />
                </button>
                {report.status === "DRAFT" && (
                  <button
                    type="button"
                    onClick={quickSend}
                    disabled={update.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6E0C24] disabled:opacity-50"
                  >
                    <Send size={12} /> {update.isPending ? "Sending…" : "Send"}
                  </button>
                )}
                {locked ? (
                  <span title="Approved reports are locked" className="p-2 text-gray-300 dark:text-white/20">
                    <Lock size={15} />
                  </span>
                ) : (
                  <>
                    <button type="button" onClick={() => setEditing(true)} title="Edit" className="rounded-lg p-2 text-gray-400 hover:bg-[#87102C]/5 hover:text-[#87102C] dark:hover:text-[#e8768a]">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(true)} title="Delete" className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 sm:px-8">
          {editing ? (
            <div className="space-y-5">
              <ReportEditor value={content} onChange={setContent} placeholder="Write your report…" minHeight={480} />
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Attachment</label>
                <ReportAttachmentUpload
                  url={attachmentUrl}
                  name={attachmentName}
                  onChange={(u, n) => { setAttachmentUrl(u); setAttachmentName(n); }}
                  disabled={pending}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-white/[0.06] pt-4">
                {isDraftFlow ? (
                  <>
                    <button
                      type="button"
                      onClick={() => saveAs("SUBMITTED")}
                      disabled={!canSave}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40"
                    >
                      <Send size={14} /> {pending ? "Sending…" : "Send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveAs("DRAFT")}
                      disabled={!canSave}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 text-sm font-bold text-gray-700 dark:text-white/80 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40"
                    >
                      {pending ? "Saving…" : "Save as draft"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={!canSave}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40"
                  >
                    <Send size={14} /> {pending ? "Saving…" : "Save changes"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (mode === "create" ? router.push(backHref) : setEditing(false))}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            report && (
              <>
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
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline"
                  >
                    <FileText size={14} /> {report.attachmentName || "Attachment"}
                  </a>
                )}
                {locked && (
                  <p className="mt-5 text-xs italic text-gray-400 dark:text-white/30">This report has been approved and is now locked from further edits.</p>
                )}
              </>
            )
          )}
        </div>

        {/* Correction thread — existing reports only */}
        {mode === "edit" && report && (
          <div className="space-y-3 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 px-6 py-6 dark:bg-white/[0.015] sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Correction thread{report.comments.length > 0 ? ` (${report.comments.length})` : ""}
            </p>

            {report.comments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-white/30">No comments yet.</p>
            ) : (
              <div className="space-y-2">
                {report.comments.map((c) => (
                  <div key={c.id} className={`rounded-lg px-3 py-2 text-xs ${c.isReviewer ? "bg-amber-50 dark:bg-amber-500/10" : "bg-white dark:bg-white/5"}`}>
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
    </motion.div>
  );
}
