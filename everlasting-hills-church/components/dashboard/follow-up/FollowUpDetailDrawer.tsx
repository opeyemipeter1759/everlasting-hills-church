"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Phone, MessageCircle, MapPin, Mail, Check, RotateCcw, UserPlus, CheckCircle,
} from "lucide-react";
import type {
  ContactMethod, ContactOutcome, FollowUpEntry, FollowUpOutcome, FollowUpStage,
} from "@/types/follow-up";
import { timeAgo } from "@/lib/utils/time";
import {
  useConfirmFollowUp, useLogFollowUpContact, useMarkFollowUpReady, useRejectFollowUp,
} from "@/lib/api/follow-up-pipeline";
import { PersonAvatar } from "./PersonAvatar";
import { RiskCategoryPill, SourceTypePill, StagePill } from "./StagePill";

interface FollowUpDetailDrawerProps {
  entry: FollowUpEntry | null;
  viewerId: string;
  onClose: () => void;
  onAssign: (entry: FollowUpEntry) => void;
}

const METHOD_OPTIONS: { value: ContactMethod; label: string; icon: typeof Phone }[] = [
  { value: "CALL", label: "Call", icon: Phone },
  { value: "SMS", label: "SMS", icon: MessageCircle },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "VISIT", label: "Visit", icon: MapPin },
  { value: "OTHER", label: "Other", icon: Mail },
];

const OUTCOME_OPTIONS: { value: ContactOutcome; label: string }[] = [
  { value: "REACHED", label: "Reached them" },
  { value: "NO_ANSWER", label: "No answer" },
  { value: "VOICEMAIL", label: "Left voicemail" },
  { value: "WRONG_NUMBER", label: "Wrong number" },
  { value: "SCHEDULED_VISIT", label: "Scheduled a visit" },
];

const CONFIRM_OUTCOME_OPTIONS: { value: FollowUpOutcome; label: string }[] = [
  { value: "BECAME_MEMBER", label: "Became a Member" },
  { value: "RETURNED", label: "Returned to Church" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "UNREACHABLE", label: "Unreachable" },
];

const OUTCOME_LABEL: Record<FollowUpOutcome, string> = {
  BECAME_MEMBER: "Became a Member",
  RETURNED: "Returned to Church",
  NOT_INTERESTED: "Not Interested",
  UNREACHABLE: "Unreachable",
};

const STAGE_STEPS: { key: FollowUpStage; label: string }[] = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "Contacted" },
  { key: "AWAITING_REVIEW", label: "Awaiting Review" },
  { key: "CONFIRMED", label: "Confirmed" },
];

function stepIndexForStage(stage: FollowUpStage): number {
  if (stage === "REOPENED") return 2; // sits back at "Contacted" while being re-worked
  return STAGE_STEPS.findIndex((s) => s.key === stage);
}

function StageTracker({ stage }: { stage: FollowUpStage }) {
  const activeIndex = stepIndexForStage(stage);
  return (
    <div className="flex items-center">
      {STAGE_STEPS.map((step, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  done
                    ? "bg-[#87102C] text-white"
                    : current
                    ? "bg-[#87102C]/15 text-[#87102C] dark:text-[#FFB3C1] border-2 border-[#87102C] dark:border-[#FFB3C1]"
                    : "bg-gray-100 dark:bg-white/10 text-gray-400"
                }`}
              >
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`text-[9px] font-semibold text-center leading-tight w-16 ${
                  current ? "text-[#87102C] dark:text-[#FFB3C1]" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STAGE_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 ${done ? "bg-[#87102C]" : "bg-gray-100 dark:bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FollowUpDetailDrawer({
  entry, viewerId, onClose, onAssign,
}: FollowUpDetailDrawerProps) {
  const logContact = useLogFollowUpContact();
  const markReady = useMarkFollowUpReady();
  const confirmEntry = useConfirmFollowUp();
  const rejectEntry = useRejectFollowUp();

  const [method, setMethod] = useState<ContactMethod>("CALL");
  const [outcome, setOutcome] = useState<ContactOutcome>("REACHED");
  const [note, setNote] = useState("");
  const [reviewMode, setReviewMode] = useState<"none" | "confirm" | "reject">("none");
  const [confirmOutcome, setConfirmOutcome] = useState<FollowUpOutcome>("BECAME_MEMBER");
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    setMethod("CALL");
    setOutcome("REACHED");
    setNote("");
    setReviewMode("none");
    setConfirmOutcome("BECAME_MEMBER");
    setReviewNote("");
  }, [entry?.id]);

  useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [entry, onClose]);

  if (!entry) return null;

  const isMine = entry.assignee?.id === viewerId;
  const canLog = entry.viewerCanWork && entry.assignee && entry.stage !== "CONFIRMED" && entry.stage !== "AWAITING_REVIEW";
  const canMarkReady = entry.viewerCanWork && entry.assignee && (entry.stage === "ASSIGNED" || entry.stage === "IN_PROGRESS" || entry.stage === "REOPENED");
  const canReview = entry.viewerCanApprove && entry.stage === "AWAITING_REVIEW";

  function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || !entry) return;
    logContact.mutate({ id: entry.id, method, outcome, note: note.trim() });
    setNote("");
  }

  function submitConfirm() {
    if (!entry) return;
    confirmEntry.mutate(
      { id: entry.id, outcome: confirmOutcome, note: reviewNote.trim() || undefined },
      { onSuccess: () => onClose() },
    );
    setReviewMode("none");
  }

  function submitReject() {
    if (!entry || !reviewNote.trim()) return;
    rejectEntry.mutate({ id: entry.id, note: reviewNote.trim() });
    setReviewMode("none");
    setReviewNote("");
  }

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white dark:bg-[#1c1c1e] shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-5 border-b border-[#E7CDD3]/40 dark:border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <PersonAvatar person={entry.person} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-bold text-[#111] dark:text-white truncate">{entry.person.name}</h2>
                <SourceTypePill type={entry.sourceType} />
              </div>
              <p className="text-[11px] text-[#8a7e80] dark:text-white/40 mt-0.5">
                Added by {entry.addedBy.name} · {timeAgo(entry.addedAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 space-y-6">
          {/* Stage tracker */}
          {entry.stage !== "CONFIRMED" ? (
            <StageTracker stage={entry.stage} />
          ) : (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Confirmed — {entry.outcome ? OUTCOME_LABEL[entry.outcome] : ""}
                </p>
                {entry.reviewNote && <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70 mt-0.5">{entry.reviewNote}</p>}
              </div>
            </div>
          )}

          {entry.absenteeDetail && (
            <div className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#111] dark:text-white">Attendance</p>
                {entry.absenteeDetail.category && <RiskCategoryPill category={entry.absenteeDetail.category} />}
              </div>
              {entry.absenteeDetail.missedServices.length === 0 ? (
                <p className="text-xs text-[#8a7e80] dark:text-white/40">No recent misses on record.</p>
              ) : (
                <ul className="space-y-1">
                  {entry.absenteeDetail.missedServices.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-white/60">
                      <span className="truncate">{s.name}</span>
                      <span className="text-[#8a7e80] dark:text-white/35 flex-shrink-0 ml-2">
                        {new Date(s.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {entry.stage === "REOPENED" && entry.reviewNote && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Sent back by unit leader</p>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/70 mt-0.5">{entry.reviewNote}</p>
            </div>
          )}

          {/* Assignee row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {entry.assignee ? (
                <>
                  <PersonAvatar person={entry.assignee} size="sm" />
                  <div>
                    <p className="text-xs text-[#8a7e80] dark:text-white/40">Assigned to</p>
                    <p className="text-sm font-semibold text-[#111] dark:text-white">
                      {isMine ? "You" : entry.assignee.name}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#8a7e80] dark:text-white/40">Not yet assigned</p>
              )}
            </div>
            {entry.viewerCanApprove && entry.stage !== "CONFIRMED" && (
              <button
                type="button"
                onClick={() => onAssign(entry)}
                className="text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:underline flex items-center gap-1"
              >
                <UserPlus size={12} aria-hidden="true" />
                {entry.assignee ? "Reassign" : "Assign"}
              </button>
            )}
          </div>

          {/* Leader review block */}
          {canReview && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/60 dark:bg-violet-500/10 p-4 space-y-3">
              <p className="text-xs font-bold text-violet-700 dark:text-violet-400">
                {entry.assignee?.name ?? "The team member"} marked this ready to close — review and confirm.
              </p>

              {reviewMode === "none" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewMode("confirm")}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewMode("reject")}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-400 bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={12} aria-hidden="true" />
                    Reject & Reopen
                  </button>
                </div>
              )}

              {reviewMode === "confirm" && (
                <div className="space-y-2.5">
                  <select
                    value={confirmOutcome}
                    onChange={(e) => setConfirmOutcome(e.target.value as FollowUpOutcome)}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                  >
                    {CONFIRM_OUTCOME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={2}
                    placeholder="Optional note…"
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25 resize-none"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReviewMode("none")} className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitConfirm}
                      disabled={confirmEntry.isPending}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {confirmEntry.isPending ? "Confirming…" : "Confirm Close"}
                    </button>
                  </div>
                </div>
              )}

              {reviewMode === "reject" && (
                <div className="space-y-2.5">
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={2}
                    placeholder="Why is this being reopened? (required)"
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25 resize-none"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReviewMode("none")} className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitReject}
                      disabled={!reviewNote.trim() || rejectEntry.isPending}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                      {rejectEntry.isPending ? "Reopening…" : "Reopen"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mark ready to close */}
          {canMarkReady && !canReview && (
            <button
              type="button"
              onClick={() => markReady.mutate(entry.id)}
              disabled={markReady.isPending}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={14} aria-hidden="true" />
              Mark Ready to Close
            </button>
          )}

          {/* Log a contact */}
          {canLog && (
            <form onSubmit={submitLog} className="space-y-3 rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-4">
              <p className="text-xs font-bold text-[#111] dark:text-white">Log a contact</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as ContactMethod)}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-2.5 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as ContactOutcome)}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-2.5 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                >
                  {OUTCOME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="What happened?"
                required
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25 resize-none"
              />
              <button
                type="submit"
                disabled={!note.trim() || logContact.isPending}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
              >
                {logContact.isPending ? "Logging…" : "Add to log"}
              </button>
            </form>
          )}

          {/* Contact log timeline */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
              Contact Log {entry.logs.length > 0 && `(${entry.logs.length})`}
            </p>
            {entry.logs.length === 0 ? (
              <p className="text-xs text-[#8a7e80] dark:text-white/35 text-center py-6">No contact logged yet.</p>
            ) : (
              <ul className="space-y-3">
                {[...entry.logs].reverse().map((log) => (
                  <li key={log.id} className="flex gap-3">
                    <PersonAvatar person={log.by} size="sm" />
                    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-bold text-[#111] dark:text-white">{log.by.name}</p>
                        <span className="text-[10px] text-[#8a7e80] dark:text-white/35">{timeAgo(log.at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                          {METHOD_OPTIONS.find((m) => m.value === log.method)?.label}
                        </span>
                        <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                        <span className="text-[10px] text-gray-500 dark:text-white/40">
                          {OUTCOME_OPTIONS.find((o) => o.value === log.outcome)?.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-white/60 mt-1.5 leading-relaxed">{log.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
