"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarX2, History, Inbox, Lock, MapPin, Phone, Video, type LucideIcon } from "lucide-react";
import {
  useApproveRequest,
  useAssignRequest,
  useCancelApproved,
  useDeclineRequest,
  useHostRequests,
  useHosts,
  usePreviewSlots,
  useProposeTime,
  useSetMeetingLink,
  type HostDetail,
  type HostRequest,
  type MeetingFormat,
} from "@/lib/api/one-on-one";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { addDays, btnGhost, btnPrimary, formatDay, formatTime, input, lagosToday, muted } from "./ui";

type Tab = "waiting" | "upcoming" | "cancelled" | "past";
type ActionKind = "approve" | "decline" | "propose" | "cancel" | "link" | "assign";
type Mode = { kind: ActionKind; id: string } | null;

const LAGOS = "Africa/Lagos";

const FORMATS: { value: MeetingFormat; label: string; icon: LucideIcon; tone: string }[] = [
  { value: "IN_PERSON", label: "In person", icon: MapPin, tone: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20" },
  { value: "GOOGLE_MEET", label: "Video call", icon: Video, tone: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20" },
  { value: "PHONE", label: "Phone call", icon: Phone, tone: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20" },
];

// ── Small display helpers ────────────────────────────────────────────────────

function dateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS }).format(new Date(iso));
}

function part(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS, ...opts }).format(new Date(iso));
}

/** "Today", "Tomorrow", or "Thursday 26 November". */
function dayHeading(iso: string): string {
  const key = dateKey(iso);
  const today = lagosToday();
  if (key === today) return "Today";
  if (key === addDays(today, 1)) return "Tomorrow";
  return part(iso, { weekday: "long", day: "numeric", month: "long" });
}

function timeRange(r: HostRequest): string {
  return `${formatTime(r.startsAt)}–${formatTime(r.endsAt)}`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** "3 days ago", "just now". */
function ago(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function DateTile({ iso, faded = false }: { iso: string; faded?: boolean }) {
  return (
    <span
      className={`flex w-14 flex-shrink-0 flex-col items-center rounded-xl border py-1.5 leading-tight ${
        faded ? "border-[#E7CDD3]/60 opacity-60 dark:border-white/10" : "border-[#E7CDD3] bg-white dark:border-white/10 dark:bg-white/[0.04]"
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#FFB3C1]">{part(iso, { weekday: "short" })}</span>
      <span className="text-xl font-bold tabular-nums text-[#111] dark:text-white">{part(iso, { day: "numeric" })}</span>
      <span className="text-[10px] font-semibold uppercase text-[#7A6A6F] dark:text-white/50">{part(iso, { month: "short" })}</span>
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] text-sm font-bold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
      {initialsOf(name)}
    </span>
  );
}

function FormatChip({ format }: { format: MeetingFormat | null }) {
  const f = FORMATS.find((x) => x.value === format);
  if (!f) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
        You decide how to meet
      </span>
    );
  }
  const Icon = f.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${f.tone}`}>
      <Icon size={12} aria-hidden="true" /> {f.label}
    </span>
  );
}

function Badges({ r }: { r: HostRequest }) {
  const badge = "rounded-full px-2 py-0.5 text-[11px] font-bold";
  return (
    <>
      {r.requesterType === "VISITOR" && <span className={`${badge} bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200`}>Visitor</span>}
      {r.viaPublicPage && !r.assigned && <span className={`${badge} bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]`}>From the public page</span>}
      {r.assigned && <span className={`${badge} bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200`}>Passed to you</span>}
    </>
  );
}

function Contact({ r }: { r: HostRequest }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px]">
      {r.requesterPhone && (
        <a href={`tel:${r.requesterPhone.replace(/\s+/g, "")}`} className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          {r.requesterPhone}
        </a>
      )}
      <span className={`select-all ${muted}`}>{r.requesterEmail}</span>
    </span>
  );
}

function PrivateNote({ r }: { r: HostRequest }) {
  if (r.note) return <p className="rounded-xl bg-[#FDF3F5] px-3.5 py-2.5 text-sm text-[#3B2A2E] dark:bg-white/[0.05] dark:text-white/80">“{r.note}”</p>;
  if (r.hasNote)
    return (
      <p className={`flex items-center gap-1.5 text-xs ${muted}`}>
        <Lock size={12} aria-hidden="true" /> A private note, visible to {r.hostName} only
      </p>
    );
  return null;
}

/** Choosing how to meet: the pastor's call, made when approving or suggesting a time. */
function FormatPicker({ value, onChange }: { value: MeetingFormat | null; onChange: (f: MeetingFormat) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[#5A4A4D] dark:text-white/60">How will you meet?</span>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How will you meet?">
        {FORMATS.map((f) => {
          const Icon = f.icon;
          const on = value === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(f.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                on
                  ? "border-[#87102C] bg-[#87102C] text-white"
                  : "border-[#E7CDD3] bg-white text-[#3B2A2E] hover:border-[#87102C] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Picks one of the host's open times for this request's session type. */
function ProposePicker({ hostId, request, value, onChange }: { hostId: string; request: HostRequest; value: string; onChange: (iso: string) => void }) {
  const from = lagosToday();
  const preview = usePreviewSlots(hostId, request.sessionTypeId, from, addDays(from, 42));
  const days = useMemo(() => preview.data ?? [], [preview.data]);
  const [date, setDate] = useState<string | null>(null);
  const active = date ?? days[0]?.date ?? null;
  const slots = days.find((d) => d.date === active)?.slots ?? [];

  if (preview.isLoading) return <p className={`text-sm ${muted}`}>Finding your open times…</p>;
  if (days.length === 0) return <p className={`text-sm ${muted}`}>No other open times in the next six weeks.</p>;

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-semibold text-[#5A4A4D] dark:text-white/60">New time</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Day">
        {days.slice(0, 14).map((d) => (
          <button
            key={d.date}
            type="button"
            aria-pressed={d.date === active}
            onClick={() => setDate(d.date)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums ${
              d.date === active ? "bg-[#87102C] text-white" : "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
            }`}
          >
            {formatDay(d.date)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Time">
        {slots.map((s) => (
          <button
            key={s.startsAt}
            type="button"
            aria-pressed={s.startsAt === value}
            onClick={() => onChange(s.startsAt)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-bold tabular-nums ${
              s.startsAt === value ? "border-[#87102C] bg-[#87102C] text-white" : "border-[#87102C]/50 text-[#87102C] dark:text-[#FFB3C1]"
            }`}
          >
            {formatTime(s.startsAt)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── The queue ───────────────────────────────────────────────────────────────

export default function RequestsCard({ host }: { host: HostDetail }) {
  const requests = useHostRequests(host.id);
  const approve = useApproveRequest(host.id);
  const decline = useDeclineRequest(host.id);
  const propose = useProposeTime(host.id);
  const cancel = useCancelApproved(host.id);
  const setLink = useSetMeetingLink(host.id);
  const assign = useAssignRequest(host.id);
  const pastors = useHosts();
  const others = (pastors.data ?? []).filter((p) => p.id !== host.id);

  const data = requests.data;
  const waitingCount = (data?.waiting.length ?? 0) + (data?.awaitingRequester.length ?? 0);
  const [tab, setTab] = useState<Tab | null>(null);
  useEffect(() => {
    if (data && tab === null) setTab(data.waiting.length > 0 ? "waiting" : "upcoming");
  }, [data, tab]);
  const current: Tab = tab ?? "waiting";

  const [mode, setMode] = useState<Mode>(null);
  const [note, setNote] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [format, setFormat] = useState<MeetingFormat | null>(null);

  const open = (kind: ActionKind, r: HostRequest) => {
    setMode({ kind, id: r.id });
    setNote("");
    setProposedAt("");
    setMeetLink(kind === "link" ? (r.meetLink ?? "") : "");
    setAssignTo("");
    setFormat(r.format);
  };

  const busy = approve.isPending || decline.isPending || propose.isPending || cancel.isPending || setLink.isPending || assign.isPending;
  const linkHint = host.googleConnected
    ? "Leave empty and Google will create a Meet link."
    : host.defaultMeetingLink
      ? "Leave empty to use your standing room."
      : "Paste a Google Meet or Zoom link, or add one later.";

  async function submit(r: HostRequest) {
    if (!mode) return;
    const body = { id: r.id, note: note.trim() || undefined };
    try {
      if (mode.kind === "approve" && format) {
        await approve.mutateAsync({ ...body, format, meetLink: format === "GOOGLE_MEET" ? meetLink.trim() || undefined : undefined });
      }
      if (mode.kind === "propose" && format) await propose.mutateAsync({ ...body, startsAt: proposedAt, format });
      if (mode.kind === "decline") await decline.mutateAsync(body);
      if (mode.kind === "cancel") await cancel.mutateAsync(body);
      if (mode.kind === "link") await setLink.mutateAsync({ id: r.id, meetLink: meetLink.trim() });
      if (mode.kind === "assign") await assign.mutateAsync({ ...body, toHostId: assignTo });
      const target = others.find((p) => p.id === assignTo)?.displayName ?? "them";
      showToast.success(
        {
          approve: `Confirmed. ${r.requesterName} has been told.`,
          decline: "Declined",
          cancel: `Cancelled. ${r.requesterName} has been sent a link to pick a new time.`,
          propose: `New time sent to ${r.requesterName}`,
          link: `Link sent to ${r.requesterName}`,
          assign: `Passed to ${target}. They've been told.`,
        }[mode.kind],
      );
      setMode(null);
    } catch (err) {
      showToast.error(errorText(err, "That didn't go through."));
    }
  }

  const actionPanel = (r: HostRequest) => {
    if (mode?.id !== r.id) return null;
    const labels: Record<ActionKind, { title: string; button: string; placeholder: string }> = {
      approve: { title: "Add a note (optional)", button: "Confirm session", placeholder: "Looking forward to it." },
      decline: { title: "Let them know why (optional)", button: "Decline", placeholder: "I'm away that week. Please pick another time." },
      propose: { title: "A note with the new time (optional)", button: "Send new time", placeholder: "That time is taken. Would this work?" },
      cancel: { title: "Tell them why", button: "Cancel session", placeholder: "Something urgent has come up." },
      link: { title: "", button: "Send link", placeholder: "" },
      assign: { title: "A note for them (optional)", button: "Pass it on", placeholder: "Could you take this one?" },
    };
    const l = labels[mode.kind];
    const needsFormat = mode.kind === "approve" || mode.kind === "propose";
    const showLink = mode.kind === "link" || (mode.kind === "approve" && format === "GOOGLE_MEET");
    const blocked =
      busy ||
      (needsFormat && !format) ||
      (mode.kind === "propose" && !proposedAt) ||
      (mode.kind === "link" && !/^https:\/\/\S+$/.test(meetLink.trim())) ||
      (mode.kind === "assign" && !assignTo);

    return (
      <div className="flex flex-col gap-3.5 rounded-xl bg-[#FFE8ED]/40 p-4 dark:bg-white/[0.04]">
        {mode.kind === "propose" && <ProposePicker hostId={host.id} request={r} value={proposedAt} onChange={setProposedAt} />}
        {needsFormat && <FormatPicker value={format} onChange={setFormat} />}
        {mode.kind === "assign" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#5A4A4D] dark:text-white/60" id={`lbl-assign-${r.id}`}>
              Pass to
            </span>
            <Select
              aria-labelledby={`lbl-assign-${r.id}`}
              value={assignTo}
              onChange={setAssignTo}
              placeholder="Choose a pastor"
              options={others.map((p) => ({ value: p.id, label: p.displayName }))}
            />
            <span className={`text-xs ${muted}`}>It keeps this time. If it doesn’t suit them, they’ll suggest another.</span>
          </div>
        )}
        {showLink && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#5A4A4D] dark:text-white/60">Google Meet or Zoom link{mode.kind === "approve" && " (optional)"}</span>
            <input
              id={`meet-link-${r.id}`}
              type="url"
              className={input}
              placeholder="https://meet.google.com/… or https://zoom.us/j/…"
              value={meetLink}
              maxLength={500}
              onChange={(e) => setMeetLink(e.target.value)}
            />
            {mode.kind === "approve" && <span className={`text-xs ${muted}`}>{linkHint}</span>}
          </label>
        )}
        {mode.kind !== "link" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#5A4A4D] dark:text-white/60">{l.title}</span>
            <textarea id={`decision-note-${r.id}`} rows={2} maxLength={600} className={`${input} resize-y`} placeholder={l.placeholder} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        )}
        {mode.kind === "cancel" && <p className={`text-xs ${muted}`}>They’ll get an email with a link to pick a new time.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={blocked} onClick={() => submit(r)}>
            {l.button}
          </button>
          <button type="button" className={btnGhost} onClick={() => setMode(null)} disabled={busy}>
            Back
          </button>
        </div>
      </div>
    );
  };

  /** Who, when and what, shared by every list. */
  const Person = ({ r, children }: { r: HostRequest; children?: React.ReactNode }) => (
    <div className="flex min-w-0 items-start gap-3">
      <Avatar name={r.requesterName} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-[#111] dark:text-white">{r.requesterName}</span>
          <Badges r={r} />
        </div>
        <span className={`text-[13px] ${muted}`}>
          {[r.sessionTypeName, r.topic, r.coHostName && `with ${r.coHostName}`].filter(Boolean).join(" · ")}
        </span>
        {children}
      </div>
    </div>
  );

  // Upcoming, grouped by day so the calendar reads at a glance.
  const upcomingByDay = useMemo(() => {
    const groups = new Map<string, HostRequest[]>();
    for (const r of data?.upcoming ?? []) {
      const k = dateKey(r.startsAt);
      groups.set(k, [...(groups.get(k) ?? []), r]);
    }
    return Array.from(groups.values());
  }, [data?.upcoming]);

  const tabs: { key: Tab; label: string; count?: number; icon: LucideIcon }[] = [
    { key: "waiting", label: "Waiting", count: waitingCount, icon: Inbox },
    { key: "upcoming", label: "Upcoming", count: data?.upcoming.length, icon: CalendarCheck2 },
    { key: "cancelled", label: "Cancelled", count: data?.cancelled.length, icon: CalendarX2 },
    { key: "past", label: "Past", icon: History },
  ];

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.05]" aria-label="Your sessions">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 className="font-serif text-2xl font-bold text-[#111] dark:text-white">Your sessions</h2>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[#E7CDD3]/60 px-3 dark:border-white/[0.07]" role="tablist" aria-label="Sessions">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = current === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(t.key);
                setMode(null);
              }}
              className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                on ? "border-[#87102C] text-[#87102C] dark:border-[#FFB3C1] dark:text-[#FFB3C1]" : "border-transparent text-[#7A6A6F] hover:text-[#111] dark:text-white/55 dark:hover:text-white"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                    t.key === "waiting" ? "bg-[#87102C] text-white" : "bg-[#F3ECEE] text-[#5A4A4D] dark:bg-white/10 dark:text-white/70"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-5 py-5" role="tabpanel">
        {requests.isLoading ? (
          <p className={`text-sm ${muted}`}>Loading your sessions…</p>
        ) : requests.isError || !data ? (
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errorText(requests.error, "Couldn’t load your sessions.")}</p>
        ) : current === "waiting" ? (
          <div className="flex flex-col gap-5">
            {data.waiting.length === 0 && data.awaitingRequester.length === 0 && (
              <p className={`text-sm ${muted}`}>Nothing waiting for you. New requests will appear here, and you’ll get an email and a notification.</p>
            )}
            {data.waiting.map((r) => (
              <article key={r.id} className="flex flex-col gap-3 rounded-2xl border border-[#E7CDD3]/70 p-4 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <DateTile iso={r.startsAt} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-lg font-bold tabular-nums text-[#111] dark:text-white">{timeRange(r)}</span>
                    <span className={`text-xs ${muted}`}>Requested {ago(r.createdAt)}</span>
                  </div>
                </div>
                <Person r={r}>
                  {(r.requesterLocation || r.foundVia) && (
                    <span className={`text-[13px] ${muted}`}>{[r.requesterLocation, r.foundVia && `found us via ${r.foundVia}`].filter(Boolean).join(" · ")}</span>
                  )}
                  <Contact r={r} />
                </Person>
                <PrivateNote r={r} />
                {mode?.id === r.id ? (
                  actionPanel(r)
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnPrimary} onClick={() => open("approve", r)}>
                      Confirm
                    </button>
                    {r.hostId === host.id && (
                      <button type="button" className={btnGhost} onClick={() => open("propose", r)}>
                        Suggest another time
                      </button>
                    )}
                    {others.length > 0 && (
                      <button type="button" className={btnGhost} onClick={() => open("assign", r)}>
                        Pass to another pastor
                      </button>
                    )}
                    <button type="button" className={btnGhost} onClick={() => open("decline", r)}>
                      Decline
                    </button>
                  </div>
                )}
              </article>
            ))}
            {data.awaitingRequester.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className={`text-xs font-bold ${muted}`}>You suggested a new time, waiting for their answer</h3>
                {data.awaitingRequester.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-dashed border-[#E7CDD3] px-3.5 py-2.5 dark:border-white/15">
                    <Avatar name={r.requesterName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111] dark:text-white">{r.requesterName}</p>
                      <p className={`text-xs tabular-nums ${muted}`}>
                        {r.proposedStartsAt ? `${dayHeading(r.proposedStartsAt)}, ${formatTime(r.proposedStartsAt)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : current === "upcoming" ? (
          upcomingByDay.length === 0 ? (
            <p className={`text-sm ${muted}`}>No confirmed sessions coming up.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {upcomingByDay.map((day) => (
                <div key={day[0].startsAt} className="flex gap-3 sm:gap-4">
                  <DateTile iso={day[0].startsAt} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <p className="pt-1 text-sm font-bold text-[#111] dark:text-white">{dayHeading(day[0].startsAt)}</p>
                    {day.map((r) => (
                      <article key={r.id} className="flex flex-col gap-3 rounded-2xl border border-[#E7CDD3]/70 p-4 dark:border-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-base font-bold tabular-nums text-[#111] dark:text-white">{timeRange(r)}</span>
                          <FormatChip format={r.format} />
                        </div>
                        <Person r={r}>
                          <Contact r={r} />
                        </Person>
                        <PrivateNote r={r} />
                        {r.format === "GOOGLE_MEET" &&
                          (r.meetLink ? (
                            <a
                              href={r.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 self-start rounded-xl bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                            >
                              <Video size={15} aria-hidden="true" /> Join the call
                            </a>
                          ) : (
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">No meeting link yet. Add one so they can join.</p>
                          ))}
                        {mode?.id === r.id ? (
                          actionPanel(r)
                        ) : (
                          <div className="flex flex-wrap gap-2 border-t border-[#E7CDD3]/50 pt-3 dark:border-white/[0.07]">
                            {r.format === "GOOGLE_MEET" && (
                              <button type="button" className={`${btnGhost} px-2.5 py-1 text-xs`} onClick={() => open("link", r)}>
                                {r.meetLink ? "Change link" : "Add link"}
                              </button>
                            )}
                            <button type="button" className={`${btnGhost} px-2.5 py-1 text-xs`} onClick={() => open("cancel", r)}>
                              Cancel session
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : current === "cancelled" ? (
          data.cancelled.length === 0 ? (
            <p className={`text-sm ${muted}`}>No cancelled sessions in the last two months.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.cancelled.map((r) => (
                <li key={r.id} className="flex gap-3 rounded-2xl border border-[#E7CDD3]/60 p-4 dark:border-white/10">
                  <DateTile iso={r.startsAt} faded />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#111] dark:text-white">{r.requesterName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          r.cancelledBy === "HOST" ? "bg-[#F3ECEE] text-[#5A4A4D] dark:bg-white/10 dark:text-white/70" : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200"
                        }`}
                      >
                        {r.cancelledBy === "HOST" ? "Cancelled by you" : "Cancelled by them"}
                      </span>
                    </div>
                    <span className={`text-[13px] tabular-nums line-through ${muted}`}>
                      {dayHeading(r.startsAt)}, {timeRange(r)}
                    </span>
                    <span className={`text-[13px] ${muted}`}>
                      {r.sessionTypeName}
                      {r.cancelledAt && ` · cancelled ${ago(r.cancelledAt)}`}
                    </span>
                    {r.cancelReason && (
                      <p className="rounded-xl bg-[#FDF3F5] px-3.5 py-2 text-sm text-[#3B2A2E] dark:bg-white/[0.05] dark:text-white/80">“{r.cancelReason}”</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : data.past.length === 0 ? (
          <p className={`text-sm ${muted}`}>No past sessions yet.</p>
        ) : (
          <ul className="divide-y divide-[#E7CDD3]/50 dark:divide-white/[0.07]">
            {data.past.map((r) => {
              const label =
                r.status === "DECLINED" ? "Declined" : r.status === "LAPSED" ? "No answer in time" : "Done";
              return (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <DateTile iso={r.startsAt} faded={r.status !== "COMPLETED" && r.status !== "APPROVED"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#111] dark:text-white">{r.requesterName}</p>
                    <p className={`truncate text-xs tabular-nums ${muted}`}>
                      {timeRange(r)} · {r.sessionTypeName}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F3ECEE] px-2 py-0.5 text-[11px] font-bold text-[#5A4A4D] dark:bg-white/10 dark:text-white/70">{label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
