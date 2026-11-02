"use client";

import { useState } from "react";
import { useAcceptProposal, useCancelMyRequest, type MyRequest } from "@/lib/api/one-on-one";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { btnGhost, btnPrimary } from "../manage/ui";
import { FORMAT_LABEL, StatusPill, formatWhenLong, pastorsOf } from "./parts";

/** The member's open request or upcoming session, styled as an appointment card. */
export default function AppointmentCard({ request: r, onPickAnother }: { request: MyRequest; onPickAnother: () => void }) {
  const cancel = useCancelMyRequest();
  const accept = useAcceptProposal();
  const [confirming, setConfirming] = useState(false);

  const approved = r.status === "APPROVED";
  const proposed = r.status === "PROPOSED" && r.proposedStartsAt && r.proposedEndsAt;

  async function onAccept() {
    try {
      await accept.mutateAsync(r.id);
      showToast.success("Booked. See you then.");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't accept that time."));
    }
  }

  async function onCancel() {
    try {
      await cancel.mutateAsync(r.id);
      showToast.success(approved ? "Session cancelled" : "Request withdrawn");
      setConfirming(false);
    } catch (err) {
      showToast.error(errorText(err, "Couldn't cancel."));
    }
  }

  async function onPickDifferent() {
    try {
      await cancel.mutateAsync(r.id);
      onPickAnother();
    } catch (err) {
      showToast.error(errorText(err, "Couldn't release that time."));
    }
  }

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
            <dd className="font-bold tabular-nums text-[#111] dark:text-white">{formatWhenLong(r.proposedStartsAt!, r.proposedEndsAt!)}</dd>
            <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">You asked for</dt>
            <dd className="tabular-nums text-[#7A6A6F] line-through dark:text-white/50">{formatWhenLong(r.startsAt, r.endsAt)}</dd>
          </>
        ) : (
          <>
            <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">When</dt>
            <dd className="font-bold tabular-nums text-[#111] dark:text-white">{formatWhenLong(r.startsAt, r.endsAt)}</dd>
          </>
        )}
        <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">Where</dt>
        <dd className="font-bold text-[#111] dark:text-white">{FORMAT_LABEL[r.format]}</dd>
        <dt className="font-semibold text-[#7A6A6F] dark:text-white/50">About</dt>
        <dd className="font-bold text-[#111] dark:text-white">{r.topic}</dd>
      </dl>

      {r.decisionNote && (
        <blockquote className="rounded-xl bg-[#FDF3F5] px-4 py-3 text-sm text-[#3B2A2E] dark:bg-white/[0.05] dark:text-white/80">
          <span className="mb-1 block text-xs font-semibold text-[#7A6A6F] dark:text-white/50">From {r.hostName}</span>
          {r.decisionNote}
        </blockquote>
      )}

      <div className="flex flex-wrap gap-2">
        {proposed && (
          <>
            <button type="button" className={btnPrimary} onClick={onAccept} disabled={accept.isPending}>
              Accept this time
            </button>
            <button type="button" className={btnGhost} onClick={onPickDifferent} disabled={cancel.isPending}>
              Pick a different time
            </button>
          </>
        )}
        {approved && r.meetLink && (
          <a href={r.meetLink} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            Join Google Meet
          </a>
        )}
        {r.canCancel && !proposed && (
          <button type="button" className={btnGhost} onClick={() => setConfirming(true)}>
            {approved ? "Cancel session" : "Withdraw request"}
          </button>
        )}
      </div>
      <p className="text-xs text-[#7A6A6F] dark:text-white/50">
        {r.status === "PENDING" && "The time is held for you. We'll email you and send a notification as soon as there's an answer."}
        {approved && (r.canCancel ? "We'll remind you the day before and an hour before." : "Less than a day to go. To change anything now, contact the church office.")}
      </p>

      <ConfirmDialog
        open={confirming}
        title={approved ? "Cancel this session?" : "Withdraw this request?"}
        description={approved ? `${pastorsOf(r)} will be told, and the time will be freed for someone else.` : "The time will be released for someone else."}
        confirmLabel={approved ? "Cancel session" : "Withdraw"}
        tone="danger"
        loading={cancel.isPending}
        onConfirm={onCancel}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
}
