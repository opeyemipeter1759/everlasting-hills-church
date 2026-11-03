"use client";

import { useState } from "react";
import { CalendarPlus, Video } from "lucide-react";
import { sessionIcsHref, useAcceptProposal, useCancelMyRequest, type MyRequest } from "@/lib/api/one-on-one";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { btnGhost, btnPrimary, input } from "../manage/ui";
import { FORMAT_LABEL, StatusPill, formatWhenLong, pastorsOf } from "./parts";

interface ViewProps {
  request: MyRequest;
  /** Times shown in this zone; Lagos when omitted. */
  timeZone?: string;
  icsHref: string;
  busy: boolean;
  onAccept: () => Promise<void>;
  /** Resolves true once cancelled, so the reason box can close. */
  onCancel: (reason: string) => Promise<boolean>;
  onPickAnother: () => Promise<void>;
}

/** The appointment card itself, shared by the member dashboard and a visitor's private link. */
export function AppointmentView({ request: r, timeZone, icsHref, busy, onAccept, onCancel, onPickAnother }: ViewProps) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const approved = r.status === "APPROVED";
  const proposed = r.status === "PROPOSED" && r.proposedStartsAt && r.proposedEndsAt;
  const online = r.format === "GOOGLE_MEET";
  const when = (s: string, e: string) => formatWhenLong(s, e, timeZone);

  return (
    <article className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white px-6 pb-6 pt-8 shadow-[0_1px_3px_rgba(135,16,44,0.06),0_8px_24px_rgba(135,16,44,0.05)] dark:border-white/[0.09] dark:bg-white/[0.05] dark:shadow-none">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#87102C] to-[#C8A04A]" />
      <StatusPill request={r} />
      <div>
        <p className="font-serif text-lg italic text-[#7A6A6F] dark:text-white/55">{approved ? "Your session with" : "Your request to meet"}</p>
        <p className="font-serif text-3xl font-bold leading-tight text-[#111] dark:text-white">{pastorsOf(r)}</p>
      </div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 border-t border-dashed border-[#E7CDD3] pt-4 text-[15px] dark:border-white/10">
        {proposed ? (
          <>
            <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">Suggested</dt>
            <dd className="font-bold tabular-nums text-[#111] dark:text-white">{when(r.proposedStartsAt!, r.proposedEndsAt!)}</dd>
            <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">You asked for</dt>
            <dd className="tabular-nums text-[#7A6A6F] line-through dark:text-white/50">{when(r.startsAt, r.endsAt)}</dd>
          </>
        ) : (
          <>
            <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">When</dt>
            <dd className="font-bold tabular-nums text-[#111] dark:text-white">{when(r.startsAt, r.endsAt)}</dd>
          </>
        )}
        <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">Where</dt>
        <dd className="font-bold text-[#111] dark:text-white">{FORMAT_LABEL[r.format]}</dd>
        {r.topic && (
          <>
            <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">About</dt>
            <dd className="font-bold text-[#111] dark:text-white">{r.topic}</dd>
          </>
        )}
        {approved && online && (
          <>
            <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">Join</dt>
            <dd className="min-w-0 break-all font-bold text-[#111] dark:text-white">
              {r.meetLink ? (
                <a href={r.meetLink} target="_blank" rel="noopener noreferrer" className="text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                  {r.meetLink}
                </a>
              ) : (
                <span className="font-medium text-[#7A6A6F] dark:text-white/55">The link will be sent to you before the session.</span>
              )}
            </dd>
          </>
        )}
      </dl>

      {r.decisionNote && (
        <blockquote className="rounded-xl bg-[#FDF3F5] px-4 py-3 text-sm text-[#3B2A2E] dark:bg-white/[0.05] dark:text-white/80">
          <span className="mb-1 block text-xs font-semibold text-[#7A6A6F] dark:text-white/50">From {r.hostName}</span>
          {r.decisionNote}
        </blockquote>
      )}

      {cancelling ? (
        <form
          className="flex flex-col gap-2.5 rounded-xl bg-[#FFE8ED]/40 p-4 dark:bg-white/[0.04]"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await onCancel(reason.trim())) {
              setCancelling(false);
              setReason("");
            }
          }}
        >
          <label htmlFor={`cancel-reason-${r.id}`} className="text-sm font-bold text-[#111] dark:text-white">
            Please let {pastorsOf(r)} know why
          </label>
          <textarea
            id={`cancel-reason-${r.id}`}
            rows={3}
            maxLength={600}
            required
            autoFocus
            className={`${input} resize-y`}
            placeholder="Something has come up at work that day."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btnPrimary} disabled={busy || reason.trim().length < 3}>
              {approved ? "Cancel session" : "Withdraw request"}
            </button>
            <button type="button" className={btnGhost} onClick={() => setCancelling(false)} disabled={busy}>
              {approved ? "Keep the session" : "Keep the request"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {proposed && (
            <>
              <button type="button" className={btnPrimary} onClick={onAccept} disabled={busy}>
                Accept this time
              </button>
              <button type="button" className={btnGhost} onClick={onPickAnother} disabled={busy}>
                Pick a different time
              </button>
            </>
          )}
          {approved && online && r.meetLink && (
            <a href={r.meetLink} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
              <Video size={15} /> Join the call
            </a>
          )}
          {approved && (
            <a href={icsHref} className={btnGhost}>
              <CalendarPlus size={15} /> Add to my calendar
            </a>
          )}
          {r.canCancel && !proposed && (
            <button type="button" className={btnGhost} onClick={() => setCancelling(true)}>
              {approved ? "Cancel session" : "Withdraw request"}
            </button>
          )}
        </div>
      )}
      <p className="text-xs text-[#7A6A6F] dark:text-white/50">
        {r.status === "PENDING" && "The time is held for you. We'll email you as soon as there's an answer."}
        {approved && (r.canCancel ? "We'll remind you the day before and an hour before." : "Less than a day to go. To change anything now, contact the church office.")}
      </p>
    </article>
  );
}

/** The member's open request or upcoming session on their dashboard. */
export default function AppointmentCard({ request, onPickAnother }: { request: MyRequest; onPickAnother: () => void }) {
  const cancel = useCancelMyRequest();
  const accept = useAcceptProposal();

  return (
    <AppointmentView
      request={request}
      icsHref={sessionIcsHref(request.id)}
      busy={cancel.isPending || accept.isPending}
      onAccept={async () => {
        try {
          await accept.mutateAsync(request.id);
          showToast.success("Booked. See you then.");
        } catch (err) {
          showToast.error(errorText(err, "Couldn't accept that time."));
        }
      }}
      onCancel={async (reason) => {
        try {
          await cancel.mutateAsync({ id: request.id, reason });
          showToast.success(request.status === "APPROVED" ? "Session cancelled" : "Request withdrawn");
          return true;
        } catch (err) {
          showToast.error(errorText(err, "Couldn't cancel."));
          return false;
        }
      }}
      onPickAnother={async () => {
        try {
          await cancel.mutateAsync({ id: request.id, reason: "Asked for a different time than the one suggested." });
          onPickAnother();
        } catch (err) {
          showToast.error(errorText(err, "Couldn't release that time."));
        }
      }}
    />
  );
}
