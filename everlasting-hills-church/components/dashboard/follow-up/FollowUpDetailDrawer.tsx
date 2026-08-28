"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { addDays, format } from "date-fns";
import {
  X, Phone, MessageCircle, MapPin, Mail, Check, UserPlus,
  ShieldOff, ShieldCheck, History, Flag, Contact, Cake, Home, HeartHandshake, Briefcase,
  MessageSquareQuote, CalendarX, Clock3, Send, Lock, BadgeCheck, Handshake, Lightbulb,
  ChevronDown, ChevronUp, UserCheck, UserX, Users2,
} from "lucide-react";
import type {
  ContactMethod, ContactOutcome, FollowUpConnection, FollowUpEntry,
  FollowUpOutcome, FollowUpStage,
} from "@/types/follow-up";
import { timeAgo } from "@/lib/utils/time";
import { useMe } from "@/lib/api";
import {
  useConfirmFollowUp, useFollowUpConnections, useFollowUpEntryDetail, useIntroduceConnection,
  useLogFollowUpContact, useOptOutFollowUpMember, useRestoreFollowUpMember, useSendToPastor,
  useSnoozeFollowUp, useUpdateConnectionStatus,
} from "@/lib/api/follow-up-pipeline";
import { getOpeningLines } from "@/lib/followUpOpeningLines";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { PersonAvatar } from "./PersonAvatar";
import { DueStatusPill, RiskCategoryPill, SourceTypePill } from "./StagePill";
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

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

const CONNECTION_STATUS_PILL: Record<string, { label: string; className: string }> = {
  CONNECTED: {
    label: "Connected",
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  DECLINED: {
    label: "Didn't work out",
    className: "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40 border-gray-200 dark:border-white/[0.09]",
  },
};

/** One suggested/introduced/connected/declined match, in its own small card. */
function ConnectionCard({
  connection, entryId,
}: { connection: FollowUpConnection; entryId: string }) {
  const introduce = useIntroduceConnection();
  const updateStatus = useUpdateConnectionStatus();

  return (
    <div className="rounded-lg border border-[#E7CDD3]/60 dark:border-white/[0.09] p-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-[11px] font-bold text-gray-500 dark:text-white/50">
          {initials(connection.member.name)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#111] dark:text-white truncate">{connection.member.name}</p>
          <p className="text-[11px] text-[#8a7e80] dark:text-white/40 mt-0.5">{connection.matchReason}</p>
        </div>
        {(connection.status === "CONNECTED" || connection.status === "DECLINED") && (
          <span
            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${CONNECTION_STATUS_PILL[connection.status].className}`}
          >
            {CONNECTION_STATUS_PILL[connection.status].label}
          </span>
        )}
      </div>

      {connection.status === "SUGGESTED" && (
        <button
          type="button"
          onClick={() => introduce.mutate({ entryId, connectionId: connection.id })}
          disabled={introduce.isPending}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#87102C] hover:bg-[#6E0C24] transition-colors px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
        >
          <Handshake size={12} aria-hidden="true" />
          {introduce.isPending ? "Introducing…" : "Introduce"}
        </button>
      )}

      {connection.status === "INTRODUCED" && (
        <>
          <p className="mt-2 text-[10px] text-[#8a7e80] dark:text-white/35">
            Introduced by {connection.introducedBy ?? "a team member"}
            {connection.introducedAt && ` · ${timeAgo(connection.introducedAt)}`}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => updateStatus.mutate({ entryId, connectionId: connection.id, status: "CONNECTED" })}
              disabled={updateStatus.isPending}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-1.5 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              <UserCheck size={12} aria-hidden="true" />
              They connected
            </button>
            <button
              type="button"
              onClick={() => updateStatus.mutate({ entryId, connectionId: connection.id, status: "DECLINED" })}
              disabled={updateStatus.isPending}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 px-2 py-1.5 text-[11px] font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <UserX size={12} aria-hidden="true" />
              Didn't work out
            </button>
          </div>
        </>
      )}

      {(connection.status === "CONNECTED" || connection.status === "DECLINED") && connection.introducedBy && (
        <p className="mt-2 text-[10px] text-[#8a7e80] dark:text-white/35">
          Introduced by {connection.introducedBy}
          {connection.introducedAt && ` · ${timeAgo(connection.introducedAt)}`}
        </p>
      )}
    </div>
  );
}

export function FollowUpDetailDrawer({
  entry: entryProp, viewerId, onClose, onAssign,
}: FollowUpDetailDrawerProps) {
  const { data: me } = useMe();
  const logContact = useLogFollowUpContact();
  const confirmEntry = useConfirmFollowUp();
  const optOutMember = useOptOutFollowUpMember();
  const restoreMember = useRestoreFollowUpMember();
  const snoozeEntry = useSnoozeFollowUp();
  const sendToPastor = useSendToPastor();

  const [logMode, setLogMode] = useState<"CONTACT" | "QUICK_UPDATE">("CONTACT");
  const [method, setMethod] = useState<ContactMethod>("CALL");
  const [outcome, setOutcome] = useState<ContactOutcome>("REACHED");
  const [note, setNote] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [openingLinesOpen, setOpeningLinesOpen] = useState(false);
  const [logOutcomeOpen, setLogOutcomeOpen] = useState(false);
  const [confirmOutcome, setConfirmOutcome] = useState<FollowUpOutcome>("REACHABLE");
  const [reviewNote, setReviewNote] = useState("");
  const [optOutConfirmOpen, setOptOutConfirmOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [customSnoozeDate, setCustomSnoozeDate] = useState("");
  const [sendToPastorConfirmOpen, setSendToPastorConfirmOpen] = useState(false);

  // Keep the last entry mounted through the close animation instead of unmounting the
  // instant the parent clears its selection, so the panel actually slides out rather
  // than just vanishing.
  const [mountedEntry, setMountedEntry] = useState<FollowUpEntry | null>(null);
  const [visible, setVisible] = useState(false);

  // Richer single-entry fetch — only this response carries `bestTimeHint`. While it's
  // loading (or for the closing-animation tail) we fall back to the list row.
  const { data: detailData } = useFollowUpEntryDetail(entryProp?.id);
  const connectionsQuery = useFollowUpConnections(entryProp?.id);

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
    setLogMode("CONTACT");
    setMethod("CALL");
    setOutcome("REACHED");
    setNote("");
    setNotePrivate(false);
    setOpeningLinesOpen(false);
    setLogOutcomeOpen(false);
    setConfirmOutcome("REACHABLE");
    setReviewNote("");
    setOptOutConfirmOpen(false);
    setSnoozeOpen(false);
    setCustomSnoozeDate("");
    setSendToPastorConfirmOpen(false);
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
  // Prefer the richer per-entry fetch (has bestTimeHint, freshest logs/connections)
  // while open; fall back to the list row prop, then the last known entry only
  // during the closing animation once the parent has already cleared it.
  // FollowUpEntryDetail is a structural superset of FollowUpEntry, so it's assignable
  // here directly — no union type needed for `entry` itself.
  const baseEntry = entryProp ?? mountedEntry;
  const entry: FollowUpEntry = detailData && detailData.id === baseEntry.id ? detailData : baseEntry;
  const bestTimeHint: string | null = detailData && detailData.id === baseEntry.id ? detailData.bestTimeHint : null;

  const isMine = entry.assignee?.id === viewerId;
  const isOptedOut = entry.memberStatus === "OPTED_OUT";
  const canManageAccount = entry.sourceType === "ABSENTEE" && entry.viewerCanApprove;
  const canLog = entry.viewerCanWork && entry.assignee && !isOptedOut && entry.stage !== "CONFIRMED";
  const canLogOutcome = entry.viewerCanApprove && !isOptedOut;
  const canSendToPastor = entry.sourceType === "FIRST_TIMER" && entry.viewerCanApprove;
  const detail = entry.personDetail;
  const isSnoozed = !!entry.snoozedUntil && new Date(entry.snoozedUntil).getTime() > Date.now();

  const personFirstName = entry.person.name.split(" ")[0] || entry.person.name;
  const callerFirstName = me?.member?.firstName ?? null;
  const openingLines = getOpeningLines({
    sourceType: entry.sourceType,
    isFirstContact: entry.contactCount === 0,
    personFirstName,
    callerFirstName,
  });

  function openOutcomeForm() {
    setConfirmOutcome(entry.outcome ?? "REACHABLE");
    setReviewNote(entry.reviewNote ?? "");
    setLogOutcomeOpen(true);
  }

  function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    logContact.mutate(
      {
        id: entry.id,
        note: note.trim(),
        kind: logMode,
        method: logMode === "CONTACT" ? method : undefined,
        outcome: logMode === "CONTACT" ? outcome : undefined,
        isPrivate: notePrivate,
      },
      { onSuccess: () => { setNote(""); setNotePrivate(false); } },
    );
  }

  function submitOutcome() {
    confirmEntry.mutate(
      { id: entry.id, outcome: confirmOutcome, note: reviewNote.trim() || undefined },
      { onSuccess: () => setLogOutcomeOpen(false) },
    );
  }

  function applySnoozePreset(days: number) {
    const until = addDays(new Date(), days).toISOString();
    snoozeEntry.mutate({ id: entry.id, until }, { onSuccess: () => setSnoozeOpen(false) });
  }

  function applyCustomSnooze() {
    if (!customSnoozeDate) return;
    snoozeEntry.mutate(
      { id: entry.id, until: new Date(customSnoozeDate).toISOString() },
      { onSuccess: () => { setSnoozeOpen(false); setCustomSnoozeDate(""); } },
    );
  }

  function handleSendToPastor() {
    sendToPastor.mutate(entry.id, {
      onSuccess: ({ whatsappLink }) => {
        setSendToPastorConfirmOpen(false);
        if (whatsappLink) window.open(whatsappLink, "_blank");
      },
    });
  }

  const latestNote = [...entry.logs].reverse().find((l) => !l.isPrivate)?.note ?? null;

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
                <DueStatusPill status={entry.dueStatus} />
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

          {/* Assignee row + snooze */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {entry.assignee ? (
                <>
                  <PersonAvatar person={entry.assignee} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#8a7e80] dark:text-white/40">Assigned to</p>
                    <p className="text-sm font-semibold text-[#111] dark:text-white truncate">
                      {isMine ? "You" : entry.assignee.name}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#8a7e80] dark:text-white/40">Not yet assigned</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
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
              {canLog && (
                <button
                  type="button"
                  onClick={() => setSnoozeOpen((v) => !v)}
                  aria-label="Snooze"
                  title="Snooze"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                    isSnoozed
                      ? "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      : "text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                  }`}
                >
                  <Clock3 size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Snooze panel */}
          {canLog && (isSnoozed || snoozeOpen) && (
            <div className="-mt-3 rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-3.5 space-y-2.5">
              {isSnoozed && !snoozeOpen ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#8a7e80] dark:text-white/40 flex items-center gap-1.5">
                    <Clock3 size={12} aria-hidden="true" className="text-sky-500" />
                    Snoozed until <span className="font-semibold text-[#111] dark:text-white">{format(new Date(entry.snoozedUntil!), "d MMM yyyy")}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => snoozeEntry.mutate({ id: entry.id, until: null })}
                    disabled={snoozeEntry.isPending}
                    className="text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:underline flex-shrink-0 disabled:opacity-50"
                  >
                    Un-snooze
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-[#111] dark:text-white">Snooze until…</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Tomorrow", days: 1 },
                      { label: "In 3 days", days: 3 },
                      { label: "Next week", days: 7 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applySnoozePreset(p.days)}
                        disabled={snoozeEntry.isPending}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customSnoozeDate}
                      onChange={(e) => setCustomSnoozeDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                    />
                    <button
                      type="button"
                      onClick={applyCustomSnooze}
                      disabled={!customSnoozeDate || snoozeEntry.isPending}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      Set
                    </button>
                    <button
                      type="button"
                      onClick={() => setSnoozeOpen(false)}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Best-time-to-call hint */}
          {bestTimeHint && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4F6] dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] px-3 py-1.5 text-[11px] font-medium text-[#87102C] dark:text-[#FFB3C1]">
              <Clock3 size={12} aria-hidden="true" />
              {bestTimeHint}
            </div>
          )}

          {/* Log a contact / quick update */}
          {canLog && (
            <form onSubmit={submitLog} className="space-y-3 rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#111] dark:text-white">Log activity</p>
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 p-0.5" role="tablist" aria-label="Log type">
                  {(["CONTACT", "QUICK_UPDATE"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={logMode === m}
                      onClick={() => setLogMode(m)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                        logMode === m
                          ? "bg-[#87102C] text-white"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {m === "CONTACT" ? "Contact" : "Quick update"}
                    </button>
                  ))}
                </div>
              </div>

              {logMode === "CONTACT" && (
                <>
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

                  {method === "CALL" && (
                    <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                      <button
                        type="button"
                        onClick={() => setOpeningLinesOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-[11px] font-semibold text-[#87102C] dark:text-[#FFB3C1]"
                      >
                        <span className="flex items-center gap-1.5">
                          <Lightbulb size={12} aria-hidden="true" />
                          Need something to say?
                        </span>
                        {openingLinesOpen ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                      </button>
                      {openingLinesOpen && (
                        <ul className="px-2.5 pb-2.5 space-y-1.5">
                          {openingLines.map((line, i) => (
                            <li key={i} className="text-[11px] text-gray-600 dark:text-white/50 leading-relaxed bg-white dark:bg-white/[0.04] rounded-md px-2.5 py-2">
                              {line}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={logMode === "CONTACT" ? "What happened?" : "What's the update?"}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-[#87102C]/25 resize-none"
              />

              <label className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-white/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notePrivate}
                  onChange={(e) => setNotePrivate(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 dark:border-white/20 text-[#87102C] focus:ring-[#87102C]/30"
                />
                <Lock size={11} aria-hidden="true" />
                Private note — only you and the unit leader can see this
              </label>

              <button
                type="submit"
                disabled={!note.trim() || logContact.isPending}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
              >
                {logContact.isPending ? "Logging…" : "Add to log"}
              </button>
            </form>
          )}

          {/* Send to Pastor */}
          {canSendToPastor && (
            entry.sentToPastorAt ? (
              <div className="rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] px-4 py-3 flex items-center gap-2.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
                  <Send size={13} aria-hidden="true" />
                </span>
                <p className="text-xs text-gray-600 dark:text-white/50">
                  Sent to Pastor by <span className="font-semibold text-[#111] dark:text-white">{entry.sentToPastorBy?.name ?? "a team member"}</span>
                  {" · "}{timeAgo(entry.sentToPastorAt)}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSendToPastorConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#87102C]/25 dark:border-[#FFB3C1]/20 bg-[#FFF4F6] dark:bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-[#87102C] dark:text-[#FFB3C1] hover:bg-[#FFE8ED] dark:hover:bg-white/[0.06] transition-colors"
              >
                <Send size={13} aria-hidden="true" />
                Send to Pastor
              </button>
            )
          )}

          {/* Connections — friend/member matches for this person */}
          <div>
            <SectionLabel icon={Users2}>
              Connections {connectionsQuery.data && connectionsQuery.data.length > 0 && `(${connectionsQuery.data.length})`}
            </SectionLabel>
            {connectionsQuery.isLoading ? (
              <p className="text-xs text-[#8a7e80] dark:text-white/35 text-center py-6">Loading suggestions…</p>
            ) : !connectionsQuery.data || connectionsQuery.data.length === 0 ? (
              <p className="text-xs text-[#8a7e80] dark:text-white/35 text-center py-6">No suggested connections yet.</p>
            ) : (
              <div className="space-y-2">
                {connectionsQuery.data.map((c) => (
                  <ConnectionCard key={c.id} connection={c} entryId={entry.id} />
                ))}
              </div>
            )}
          </div>

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
                    {log.kind === "CONNECTION" ? (
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
                        <Handshake size={13} aria-hidden="true" />
                      </span>
                    ) : (
                      <PersonAvatar person={log.by} size="sm" />
                    )}
                    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-bold text-[#111] dark:text-white">{log.by.name}</p>
                        <span className="text-[10px] text-[#8a7e80] dark:text-white/35">{timeAgo(log.at)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {log.kind === "CONTACT" && log.method && (
                          <>
                            <span className="text-[10px] font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                              {METHOD_OPTIONS.find((m) => m.value === log.method)?.label}
                            </span>
                            {log.outcome && (
                              <>
                                <span className="text-[10px] text-gray-300 dark:text-white/20">·</span>
                                <span className="text-[10px] text-gray-500 dark:text-white/40">
                                  {OUTCOME_OPTIONS.find((o) => o.value === log.outcome)?.label}
                                </span>
                              </>
                            )}
                          </>
                        )}
                        {log.kind === "QUICK_UPDATE" && (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                            Quick update
                          </span>
                        )}
                        {log.kind === "SYSTEM" && (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/[0.09]">
                            System
                          </span>
                        )}
                        {log.isPastoralContact && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                            <BadgeCheck size={9} aria-hidden="true" />
                            Pastoral Call
                          </span>
                        )}
                        {log.isPrivate && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/[0.09]">
                            <Lock size={9} aria-hidden="true" />
                            Private
                          </span>
                        )}
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

      <ConfirmDialog
        open={sendToPastorConfirmOpen}
        tone="info"
        title="Send to Pastor?"
        description={
          <div className="space-y-2">
            <p>This will share the following with the Pastor:</p>
            <dl className="text-xs bg-gray-50 dark:bg-white/5 rounded-lg p-3 space-y-1.5">
              <div className="flex gap-2"><dt className="font-semibold w-20 flex-shrink-0">Name</dt><dd className="min-w-0 break-words">{entry.person.name}</dd></div>
              {entry.person.phone && (
                <div className="flex gap-2"><dt className="font-semibold w-20 flex-shrink-0">Phone</dt><dd>{entry.person.phone}</dd></div>
              )}
              {detail?.howTheyHeard && (
                <div className="flex gap-2"><dt className="font-semibold w-20 flex-shrink-0">Heard via</dt><dd className="min-w-0 break-words">{detail.howTheyHeard}</dd></div>
              )}
              {latestNote && (
                <div className="flex gap-2"><dt className="font-semibold w-20 flex-shrink-0">Latest note</dt><dd className="min-w-0 break-words">{latestNote}</dd></div>
              )}
            </dl>
          </div>
        }
        confirmLabel="Send to Pastor"
        loading={sendToPastor.isPending}
        onConfirm={handleSendToPastor}
        onCancel={() => setSendToPastorConfirmOpen(false)}
      />
    </div>,
    document.body,
  );
}
