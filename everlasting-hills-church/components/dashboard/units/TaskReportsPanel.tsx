"use client";

import { useState } from "react";
import { CheckCheck, ChevronDown, ChevronUp, ClipboardList, Loader2, Pencil, Trash2, Undo2 } from "lucide-react";
import { useDeleteUnitTaskReport, useReviewUnitTaskReport, useUnitTaskReports } from "@/lib/api";
import type { UnitTaskReport } from "@/types";
import { showToast } from "@/components/ui/toast/toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { LucideIcon } from "lucide-react";
import { OUTCOME_META, REPORT_STATUS_META, formatDateTime, timeAgo } from "./taskReport";

function Pill({ label, cls, icon: Icon }: { label: string; cls: string; icon?: LucideIcon }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {Icon && <Icon size={11} />}
      {label}
    </span>
  );
}

function Section({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/35">{title}</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{body}</p>
    </div>
  );
}

/**
 * The reports filed on a task. A lead sees all of them with Acknowledge /
 * Send back controls; the author sees their own with Edit / Withdraw while
 * that's still allowed. `reportCount` seeds the toggle from the task list.
 */
export default function TaskReportsPanel({
  unitId,
  taskId,
  reportCount = 0,
  canReview,
  viewerProfileId,
  onEdit,
  defaultOpen = false,
}: {
  unitId: string;
  taskId: string;
  reportCount?: number;
  canReview: boolean;
  viewerProfileId: string | null;
  onEdit?: (report: UnitTaskReport) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [sendBackFor, setSendBackFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UnitTaskReport | null>(null);

  const { data: reports, isLoading } = useUnitTaskReports(open ? unitId : null, open ? taskId : null);
  const review = useReviewUnitTaskReport();
  const del = useDeleteUnitTaskReport();

  const count = reports?.length ?? reportCount;
  if (count === 0 && !open) return null;

  async function acknowledge(r: UnitTaskReport) {
    try {
      await review.mutateAsync({ unitId, taskId, reportId: r.id, status: "ACKNOWLEDGED" });
      showToast.success("Report acknowledged");
    } catch {
      showToast.error("Couldn't acknowledge this report");
    }
  }

  async function sendBack(r: UnitTaskReport) {
    if (!note.trim()) return;
    try {
      await review.mutateAsync({ unitId, taskId, reportId: r.id, status: "NEEDS_REVISION", note: note.trim() });
      showToast.success("Sent back for revision");
      setSendBackFor(null);
      setNote("");
    } catch {
      showToast.error("Couldn't send this report back");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync({ unitId, taskId, reportId: deleteTarget.id });
      showToast.success("Report removed");
    } catch {
      showToast.error("Couldn't remove this report");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
      >
        <ClipboardList size={13} />
        <span>{count === 0 ? "Reports" : `${count} report${count === 1 ? "" : "s"}`}</span>
        {open ? <ChevronUp size={12} className="opacity-60" /> : <ChevronDown size={12} className="opacity-60" />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Loading reports…
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="px-3.5 py-6 text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">No reports yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {reports.map((r) => {
                const outcome = OUTCOME_META[r.outcome];
                const status = REPORT_STATUS_META[r.status];
                const isAuthor = !!viewerProfileId && r.author?.profileId === viewerProfileId;
                const canEdit = isAuthor && r.status !== "ACKNOWLEDGED" && !!onEdit;
                const canDelete = canReview || (isAuthor && r.status === "SUBMITTED");
                const pendingReview = canReview && r.status === "SUBMITTED";
                return (
                  <li key={r.id} className="px-3.5 py-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pill label={outcome.label} cls={outcome.cls} icon={outcome.icon} />
                        <Pill label={status.label} cls={status.cls} />
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-white/40">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{r.author?.name ?? "Unknown"}</span>
                        {" · "}
                        <time dateTime={r.createdAt} title={formatDateTime(r.createdAt)}>{timeAgo(r.createdAt)}</time>
                        {r.updatedAt !== r.createdAt && r.status !== "ACKNOWLEDGED" && (
                          <span className="italic"> (edited)</span>
                        )}
                      </p>
                    </div>

                    <Section title="What was done" body={r.summary} />
                    <Section title="Challenges" body={r.challenges} />
                    <Section title="Next steps" body={r.nextSteps} />

                    {r.reviewNote && r.reviewedBy && (
                      <div className={`rounded-lg border px-3 py-2 ${r.status === "NEEDS_REVISION" ? "border-rose-500/20 bg-rose-500/5" : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]"}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/35">
                          Note from {r.reviewedBy.name}
                          {r.reviewedAt && <span className="font-normal normal-case tracking-normal"> · {formatDateTime(r.reviewedAt)}</span>}
                        </p>
                        <p className="mt-0.5 text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.reviewNote}</p>
                      </div>
                    )}

                    {(pendingReview || canEdit || canDelete) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {pendingReview && sendBackFor !== r.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => acknowledge(r)}
                              disabled={review.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCheck size={13} /> Acknowledge
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSendBackFor(r.id); setNote(""); }}
                              disabled={review.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                            >
                              <Undo2 size={13} /> Send back
                            </button>
                          </>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit?.(r)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <Pencil size={13} /> {r.status === "NEEDS_REVISION" ? "Revise" : "Edit"}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(r)}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} /> {isAuthor && !canReview ? "Withdraw" : "Remove"}
                          </button>
                        )}
                      </div>
                    )}

                    {sendBackFor === r.id && (
                      <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 space-y-2">
                        <label htmlFor={`sendback-${r.id}`} className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
                          What needs to change?
                        </label>
                        <textarea
                          id={`sendback-${r.id}`}
                          value={note}
                          onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                          rows={3}
                          autoFocus
                          placeholder="Be specific so the author knows what to fix."
                          className="w-full resize-y rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-[13px] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#87102C]/25"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setSendBackFor(null); setNote(""); }}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => sendBack(r)}
                            disabled={!note.trim() || review.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6E0C24] disabled:opacity-40"
                          >
                            {review.isPending ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
                            Send back
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={canReview ? "Remove this report?" : "Withdraw your report?"}
        description={canReview ? "It will be deleted from the task's record." : "Your lead won't see it any more. You can file a new one later."}
        confirmLabel={canReview ? "Remove" : "Withdraw"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
