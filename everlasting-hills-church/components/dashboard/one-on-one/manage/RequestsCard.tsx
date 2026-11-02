"use client";

import { useMemo, useState } from "react";
import { Inbox, Lock } from "lucide-react";
import {
  useApproveRequest,
  useCancelApproved,
  useDeclineRequest,
  useHostRequests,
  usePreviewSlots,
  useProposeTime,
  useSetMeetingLink,
  type HostDetail,
  type HostRequest,
} from "@/lib/api/one-on-one";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { FORMAT_LABEL, formatWhenLong } from "../member/parts";
import { Section, addDays, btnGhost, btnPrimary, formatDay, formatTime, input, lagosToday, muted } from "./ui";

type Mode = { kind: "approve" | "decline" | "propose" | "cancel" | "link"; id: string } | null;

function RequesterLine({ r }: { r: HostRequest }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-bold text-[#111] dark:text-white">{r.requesterName}</span>
      {r.requesterType === "VISITOR" && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">Visitor</span>
      )}
    </div>
  );
}

function Details({ r }: { r: HostRequest }) {
  const contact = [r.requesterPhone, r.requesterEmail].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-col gap-1 text-[13px] text-[#7A6A6F] dark:text-white/55">
      <span className="tabular-nums">{formatWhenLong(r.startsAt, r.endsAt)}</span>
      <span>
        {r.sessionTypeName} · {FORMAT_LABEL[r.format]} · {r.topic}
        {r.coHostName && ` · with ${r.coHostName}`}
      </span>
      {(r.requesterLocation || r.foundVia) && <span>{[r.requesterLocation, r.foundVia && `Found us via ${r.foundVia}`].filter(Boolean).join(" · ")}</span>}
      {contact && <span className="select-all">{contact}</span>}
    </div>
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

export default function RequestsCard({ host }: { host: HostDetail }) {
  const requests = useHostRequests(host.id);
  const approve = useApproveRequest(host.id);
  const decline = useDeclineRequest(host.id);
  const propose = useProposeTime(host.id);
  const cancel = useCancelApproved(host.id);
  const setLink = useSetMeetingLink(host.id);
  const [mode, setMode] = useState<Mode>(null);
  const [note, setNote] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [meetLink, setMeetLink] = useState("");

  const open = (kind: NonNullable<Mode>["kind"], r: HostRequest) => {
    setMode({ kind, id: r.id });
    setNote("");
    setProposedAt("");
    setMeetLink(kind === "link" ? (r.meetLink ?? "") : "");
  };

  async function submit(r: HostRequest) {
    if (!mode) return;
    const body = { id: r.id, note: note.trim() || undefined };
    try {
      if (mode.kind === "approve") await approve.mutateAsync({ ...body, meetLink: meetLink.trim() || undefined });
      if (mode.kind === "decline") await decline.mutateAsync(body);
      if (mode.kind === "cancel") await cancel.mutateAsync(body);
      if (mode.kind === "propose") await propose.mutateAsync({ ...body, startsAt: proposedAt });
      if (mode.kind === "link") await setLink.mutateAsync({ id: r.id, meetLink: meetLink.trim() });
      showToast.success(
        {
          approve: `Approved. ${r.requesterName} has been told.`,
          decline: "Declined",
          cancel: "Session cancelled",
          propose: `New time sent to ${r.requesterName}`,
          link: `Link sent to ${r.requesterName}`,
        }[mode.kind],
      );
      setMode(null);
    } catch (err) {
      showToast.error(errorText(err, "That didn't go through."));
    }
  }

  const busy = approve.isPending || decline.isPending || propose.isPending || cancel.isPending || setLink.isPending;
  const online = (r: HostRequest) => r.format === "GOOGLE_MEET";
  const linkHint = host.googleConnected
    ? "Leave empty and Google will create a Meet link."
    : host.defaultMeetingLink
      ? "Leave empty to use your standing room."
      : "Paste a Google Meet or Zoom link, or add one later.";
  const data = requests.data;

  const actionPanel = (r: HostRequest) => {
    if (mode?.id !== r.id) return null;
    const labels = {
      approve: { title: "Add a note (optional)", button: "Approve", placeholder: "Looking forward to it." },
      decline: { title: "Let them know why (optional)", button: "Decline", placeholder: "I'm away that week. Please pick another time." },
      propose: { title: "A note with the new time (optional)", button: "Send new time", placeholder: "That time is taken. Would this work?" },
      cancel: { title: "Tell them why", button: "Cancel session", placeholder: "Something urgent has come up." },
      link: { title: "", button: "Send link", placeholder: "" },
    }[mode.kind];
    const showLink = mode.kind === "link" || (mode.kind === "approve" && online(r));
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-[#FFE8ED]/40 p-3.5 dark:bg-white/[0.04]">
        {mode.kind === "propose" && <ProposePicker hostId={host.id} request={r} value={proposedAt} onChange={setProposedAt} />}
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
            <span className="text-xs font-semibold text-[#5A4A4D] dark:text-white/60">{labels.title}</span>
            <textarea id={`decision-note-${r.id}`} rows={2} maxLength={600} className={`${input} resize-y`} placeholder={labels.placeholder} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            disabled={busy || (mode.kind === "propose" && !proposedAt) || (mode.kind === "link" && !/^https:\/\/\S+$/.test(meetLink.trim()))}
            onClick={() => submit(r)}
          >
            {labels.button}
          </button>
          <button type="button" className={btnGhost} onClick={() => setMode(null)} disabled={busy}>
            Back
          </button>
        </div>
      </div>
    );
  };

  const count = data?.waiting.length ?? 0;

  return (
    <Section
      icon={Inbox}
      eyebrow="Requests"
      title="Waiting for you"
      action={count > 0 ? <span className="rounded-full bg-[#87102C] px-2.5 py-0.5 text-xs font-bold text-white">{count}</span> : undefined}
    >
      {requests.isLoading ? (
        <p className={`text-sm ${muted}`}>Loading requests…</p>
      ) : requests.isError || !data ? (
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errorText(requests.error, "Couldn’t load requests.")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {data.waiting.length === 0 ? (
            <p className={`text-sm ${muted}`}>No requests waiting. New ones will appear here, and you’ll get an email and a notification.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[#E7CDD3]/50 dark:divide-white/[0.07]">
              {data.waiting.map((r) => (
                <li key={r.id} className="flex flex-col gap-2.5 py-4 first:pt-0">
                  <RequesterLine r={r} />
                  <Details r={r} />
                  <PrivateNote r={r} />
                  {mode?.id === r.id ? (
                    actionPanel(r)
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={btnPrimary} onClick={() => open("approve", r)}>
                        Approve
                      </button>
                      {r.hostId === host.id && (
                        <button type="button" className={btnGhost} onClick={() => open("propose", r)}>
                          Suggest another time
                        </button>
                      )}
                      <button type="button" className={btnGhost} onClick={() => open("decline", r)}>
                        Decline
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {data.awaitingRequester.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold text-[#7A6A6F] dark:text-white/50">New time suggested, waiting for their answer</h3>
              <ul className="flex flex-col gap-2">
                {data.awaitingRequester.map((r) => (
                  <li key={r.id} className="rounded-xl border border-[#E7CDD3]/70 px-3.5 py-2.5 text-sm dark:border-white/10">
                    <span className="font-semibold text-[#111] dark:text-white">{r.requesterName}</span>
                    <span className={`block text-xs tabular-nums ${muted}`}>
                      Suggested {r.proposedStartsAt && r.proposedEndsAt ? formatWhenLong(r.proposedStartsAt, r.proposedEndsAt) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-[#7A6A6F] dark:text-white/50">Coming up</h3>
            {data.upcoming.length === 0 ? (
              <p className={`text-sm ${muted}`}>No approved sessions coming up.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-[#E7CDD3]/50 dark:divide-white/[0.07]">
                {data.upcoming.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 py-3">
                    <RequesterLine r={r} />
                    <Details r={r} />
                    <PrivateNote r={r} />
                    {online(r) &&
                      (r.meetLink ? (
                        <a href={r.meetLink} target="_blank" rel="noopener noreferrer" className="self-start break-all text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                          {r.meetLink}
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">No meeting link yet. Add one so they can join.</p>
                      ))}
                    {mode?.id === r.id ? (
                      actionPanel(r)
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {online(r) && (
                          <button type="button" className={`${btnGhost} px-2.5 py-1 text-xs`} onClick={() => open("link", r)}>
                            {r.meetLink ? "Change link" : "Add link"}
                          </button>
                        )}
                        <button type="button" className={`${btnGhost} px-2.5 py-1 text-xs`} onClick={() => open("cancel", r)}>
                          Cancel session
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data.recent.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-bold text-[#7A6A6F] dark:text-white/50">Recent ({data.recent.length})</summary>
              <ul className="mt-2 flex flex-col gap-1.5">
                {data.recent.map((r) => (
                  <li key={r.id} className={`text-sm ${muted}`}>
                    <span className="font-semibold text-[#111] dark:text-white/85">{r.requesterName}</span> · {formatWhenLong(r.startsAt, r.endsAt)} ·{" "}
                    {r.status.toLowerCase()}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Section>
  );
}
