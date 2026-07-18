"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Phone, MessageCircle, MapPin, Mail, Check, UserPlus,
  ShieldOff, ShieldCheck, History, Flag, Contact, Cake, Home, HeartHandshake, Briefcase,
  MessageSquareQuote, CalendarX,
} from "lucide-react";
import type {
  ContactMethod, ContactOutcome, FollowUpEntry, FollowUpOutcome, FollowUpStage,
} from "@/types/follow-up";
import { timeAgo } from "@/lib/utils/time";
import {
  useConfirmFollowUp, useLogFollowUpContact, useOptOutFollowUpMember, useRestoreFollowUpMember,
} from "@/lib/api/follow-up-pipeline";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { PersonAvatar } from "./PersonAvatar";
import { RiskCategoryPill, SourceTypePill } from "./StagePill";
import { Select } from "@/components/ui/select";

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
  { value: "REACHABLE", label: "Reachable" },
  { value: "UNREACHABLE", label: "Unreachable" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "TRAVEL", label: "Travel" },
  { value: "CAME_FOR_VISITING", label: "Came for Visiting" },
  { value: "HAVE_A_CHURCH", label: "Have a Church" },
  { value: "WANT_TO_BE_MEMBER", label: "Want to be a Member" },
];

const STAGE_STEPS: { key: FollowUpStage; label: string }[] = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "In Progress" },
];

const STAGE_ACCENT: Record<FollowUpStage, string> = {
  UNASSIGNED: "from-gray-300 to-gray-400 dark:from-white/20 dark:to-white/10",
  ASSIGNED: "from-sky-400 to-sky-500",
  IN_PROGRESS: "from-amber-400 to-amber-500",
  AWAITING_REVIEW: "from-violet-400 to-violet-500",
  CONFIRMED: "from-emerald-400 to-emerald-500",
  REOPENED: "from-rose-400 to-rose-500",
};

/** Follow-up is continuous (contacted weekly, indefinitely) rather than a queue with
 * a hand-off step, so the tracker only shows the 3 live stages. Legacy AWAITING_REVIEW
 * / REOPENED rows (from before this changed) and CONFIRMED (an outcome was logged, but
 * work can still continue) all read as "fully underway". */
function stepIndexForStage(stage: FollowUpStage): number {
  if (stage === "UNASSIGNED") return 0;
  if (stage === "ASSIGNED") return 1;
  return STAGE_STEPS.length; // IN_PROGRESS, AWAITING_REVIEW, CONFIRMED, REOPENED
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

/** Small uppercase section header — icon in a tinted circle + label, used consistently
 * across the drawer's body so each block reads as one coherent system rather than
 * ad-hoc styling per section. */
function SectionLabel({ icon: Icon, children }: { icon: typeof Phone; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
        <Icon size={11} aria-hidden="true" />
      </span>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{children}</p>
    </div>
  );
}

/** One cell in the Contact & Details grid. `full` spans both columns, for values
 * too long to sit comfortably side-by-side (e.g. a free-text "how they heard"). */
function DetailRow({
  icon: Icon, label, value, href, full,
}: { icon: typeof Phone; label: string; value: string; href?: string; full?: boolean }) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={`group flex items-start gap-2.5 ${full ? "col-span-2" : ""}`}
    >
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/[0.06] text-gray-400 dark:text-white/40 group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] transition-colors">
        <Icon size={13} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-[#8a7e80] dark:text-white/35">{label}</p>
        <p className="text-xs font-medium text-[#111] dark:text-white/80 break-words group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] transition-colors">
          {value}
        </p>
      </div>
    </Wrapper>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function FollowUpDetailDrawer({
  entry: entryProp, viewerId, onClose, onAssign,
}: FollowUpDetailDrawerProps) {
  const logContact = useLogFollowUpContact();
  const confirmEntry = useConfirmFollowUp();
  const optOutMember = useOptOutFollowUpMember();
  const restoreMember = useRestoreFollowUpMember();

  const [method, setMethod] = useState<ContactMethod>("CALL");
  const [outcome, setOutcome] = useState<ContactOutcome>("REACHED");
  const [note, setNote] = useState("");
  const [logOutcomeOpen, setLogOutcomeOpen] = useState(false);
  const [confirmOutcome, setConfirmOutcome] = useState<FollowUpOutcome>("REACHABLE");
  const [reviewNote, setReviewNote] = useState("");
  const [optOutConfirmOpen, setOptOutConfirmOpen] = useState(false);

  // Keep the last entry mounted through the close animation instead of unmounting the
  // instant the parent clears its selection, so the panel actually slides out rather
  // than just vanishing.
  const [mountedEntry, setMountedEntry] = useState<FollowUpEntry | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (entryProp) {
      setMountedEntry(entryProp);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMountedEntry(null), 300);
    return () => clearTimeout(t);
  }, [entryProp]);

  useEffect(() => {
    setMethod("CALL");
    setOutcome("REACHED");
    setNote("");
    setLogOutcomeOpen(false);
    setConfirmOutcome("REACHABLE");
    setReviewNote("");
    setOptOutConfirmOpen(false);
  }, [entryProp?.id]);

  useEffect(() => {
    if (!entryProp) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [entryProp, onClose]);

  if (!mountedEntry) return null;
  // Prefer the live prop (fresh data) while open; fall back to the last known entry
  // only during the closing animation, once the parent has already cleared it.
  const entry = entryProp ?? mountedEntry;

  const isMine = entry.assignee?.id === viewerId;
  const isOptedOut = entry.memberStatus === "OPTED_OUT";
  const canManageAccount = entry.sourceType === "ABSENTEE" && entry.viewerCanApprove;
  const canLog = entry.viewerCanWork && entry.assignee && !isOptedOut && entry.stage !== "CONFIRMED";
  const canLogOutcome = entry.viewerCanApprove && !isOptedOut;
  const detail = entry.personDetail;

  function openOutcomeForm() {
    setConfirmOutcome(entry.outcome ?? "REACHABLE");
    setReviewNote(entry.reviewNote ?? "");
    setLogOutcomeOpen(true);
  }

  function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    logContact.mutate({ id: entry.id, method, outcome, note: note.trim() });
    setNote("");
  }

  function submitOutcome() {
    confirmEntry.mutate(
      { id: entry.id, outcome: confirmOutcome, note: reviewNote.trim() || undefined },
      { onSuccess: () => setLogOutcomeOpen(false) },
    );
  }

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white dark:bg-[#1c1c1e] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className={`h-1 flex-shrink-0 bg-gradient-to-r ${STAGE_ACCENT[entry.stage]}`} aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-5 border-b border-[#E7CDD3]/40 dark:border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <PersonAvatar person={entry.person} />
              {isOptedOut && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 ring-2 ring-white dark:ring-[#1c1c1e]">
                  <ShieldOff size={9} className="text-white" aria-hidden="true" />
                </span>
              )}
            </div>
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
          {isOptedOut && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3.5">
              <div className="flex items-start gap-3">
                <ShieldOff size={16} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Opted out — can't sign in</p>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/70 mt-0.5">
                    This member opted out of the church roster and is blocked from logging in.
                  </p>
                </div>
              </div>
              {canManageAccount && (
                <button
                  type="button"
                  onClick={() => restoreMember.mutate(entry.id)}
                  disabled={restoreMember.isPending}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <ShieldCheck size={13} aria-hidden="true" />
                  {restoreMember.isPending ? "Restoring…" : "Restore — let them join back"}
                </button>
              )}
            </div>
          )}

          {/* Stage tracker — a continuous weekly effort, not a queue with a finish line */}
          <StageTracker stage={entry.stage} />

          {entry.absenteeDetail && (
            <div>
              <SectionLabel icon={CalendarX}>Attendance</SectionLabel>
              <div className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex" aria-hidden="true">
                      {Array.from({ length: entry.absenteeDetail.totalRecent }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full mr-1 last:mr-0 ${
                            i < entry.absenteeDetail!.attendedCount
                              ? "bg-emerald-500"
                              : "bg-rose-300 dark:bg-rose-500/40"
                          }`}
                        />
                      ))}
                    </span>
                    <span className="text-xs font-semibold text-[#111] dark:text-white">
                      {entry.absenteeDetail.attendedCount}/{entry.absenteeDetail.totalRecent} recent services
                    </span>
                  </div>
                  {entry.absenteeDetail.category && <RiskCategoryPill category={entry.absenteeDetail.category} />}
                </div>

                {entry.absenteeDetail.missedServices.length === 0 ? (
                  <p className="text-xs text-[#8a7e80] dark:text-white/40">No recent misses on record.</p>
                ) : (
                  <div>
                    <p className="text-[10px] text-[#8a7e80] dark:text-white/35 mb-1.5">Missed</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.absenteeDetail.missedServices.map((s) => (
                        <span
                          key={s.id}
                          title={s.name}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/15 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-400"
                        >
                          {new Date(s.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact & Details — full member/visitor profile, including who invited them */}
          <div>
            <SectionLabel icon={Contact}>Contact & Details</SectionLabel>
            <div className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-4 grid grid-cols-2 gap-x-3 gap-y-4">
              {entry.person.phone && (
                <DetailRow icon={Phone} label="Phone" value={entry.person.phone} href={`tel:${entry.person.phone}`} />
              )}
              {entry.person.email && (
                <DetailRow icon={Mail} label="Email" value={entry.person.email} href={`mailto:${entry.person.email}`} />
              )}
              {detail?.gender && <DetailRow icon={Contact} label="Gender" value={detail.gender} />}
              {detail?.dateOfBirth && <DetailRow icon={Cake} label="Date of Birth" value={formatDate(detail.dateOfBirth)} />}
              {detail?.occupation && <DetailRow icon={Briefcase} label="Occupation" value={detail.occupation} />}
              {detail?.memberSince && <DetailRow icon={Contact} label="Member Since" value={formatDate(detail.memberSince)} />}
              {detail?.invitedBy && <DetailRow icon={HeartHandshake} label="Invited By" value={detail.invitedBy} />}
              {detail?.address && <DetailRow icon={Home} label="Address" value={detail.address} full />}
              {detail?.howTheyHeard && <DetailRow icon={MessageSquareQuote} label="How They Heard About Us" value={detail.howTheyHeard} full />}
              {!entry.person.phone && !entry.person.email && !detail?.address && !detail?.gender && !detail?.dateOfBirth
                && !detail?.occupation && !detail?.memberSince && !detail?.invitedBy && !detail?.howTheyHeard && (
                <p className="col-span-2 text-xs text-[#8a7e80] dark:text-white/35">No additional details on record.</p>
              )}
            </div>
          </div>

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
            {entry.viewerCanApprove && !isOptedOut && (
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

          {/* Log a contact */}
          {canLog && (
            <form onSubmit={submitLog} className="space-y-3 rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-4">
              <p className="text-xs font-bold text-[#111] dark:text-white">Log a contact</p>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  aria-label="Contact method"
                  value={method}
                  onChange={(v) => setMethod(v as ContactMethod)}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-2.5 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                  options={METHOD_OPTIONS.map((m) => ({ value: m.value, label: m.label }))}
                />
                <Select
                  aria-label="Contact outcome"
                  value={outcome}
                  onChange={(v) => setOutcome(v as ContactOutcome)}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-2.5 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                  options={OUTCOME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
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

          {/* Contact log timeline — every review, with who left it */}
          <div>
            <SectionLabel icon={History}>
              Activity {entry.logs.length > 0 && `(${entry.logs.length})`}
            </SectionLabel>
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

          {/* Log outcome — a team lead can do this any time, not gated on a hand-off */}
          {canLogOutcome && (
            <div className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-4 space-y-3">
              <SectionLabel icon={Flag}>Outcome</SectionLabel>

              {!logOutcomeOpen ? (
                <button
                  type="button"
                  onClick={openOutcomeForm}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#87102C]/30 dark:border-[#FFB3C1]/25 px-3 py-2 text-xs font-bold text-[#87102C] dark:text-[#FFB3C1] hover:bg-[#FFF4F6] dark:hover:bg-white/5 transition-colors"
                >
                  <Flag size={12} aria-hidden="true" />
                  {entry.outcome ? "Update outcome" : "Log an outcome"}
                </button>
              ) : (
                <div className="space-y-2.5">
                  <Select
                    aria-label="Confirmation outcome"
                    value={confirmOutcome}
                    onChange={(v) => setConfirmOutcome(v as FollowUpOutcome)}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                    options={CONFIRM_OUTCOME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  />
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={2}
                    placeholder="Optional note…"
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25 resize-none"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setLogOutcomeOpen(false)} className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitOutcome}
                      disabled={confirmEntry.isPending}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
                    >
                      {confirmEntry.isPending ? "Saving…" : "Save Outcome"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account access — opt-out, de-emphasized since it's rare and consequential */}
          {canManageAccount && !isOptedOut && (
            <div className="border-t border-[#E7CDD3]/40 dark:border-white/[0.07] pt-4">
              <button
                type="button"
                onClick={() => setOptOutConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <ShieldOff size={12} aria-hidden="true" />
                Opt this member out
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={optOutConfirmOpen}
        tone="danger"
        title="Opt this member out?"
        description={
          <>
            <span className="font-semibold">{entry.person.name}</span> will be blocked from signing in until a team
            lead restores them. This does not delete their record.
          </>
        }
        confirmLabel="Opt Out"
        loading={optOutMember.isPending}
        onConfirm={() => {
          optOutMember.mutate(entry.id, { onSuccess: () => setOptOutConfirmOpen(false) });
        }}
        onCancel={() => setOptOutConfirmOpen(false)}
      />
    </div>,
    document.body,
  );
}
