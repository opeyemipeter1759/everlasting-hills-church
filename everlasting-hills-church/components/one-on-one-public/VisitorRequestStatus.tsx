"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";
import {
  useAcceptVisitorProposal,
  useCancelVisitorRequest,
  useConfirmVisitorRequest,
  useVisitorRequest,
  visitorIcsHref,
} from "@/lib/api/one-on-one-public";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { btnGhost, btnPrimary } from "@/components/dashboard/one-on-one/manage/ui";
import { AppointmentView } from "@/components/dashboard/one-on-one/member/AppointmentCard";
import { StatusPill, formatWhenLong, pastorsOf } from "@/components/dashboard/one-on-one/member/parts";

const card = "mx-auto flex max-w-xl flex-col items-start gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-8 dark:border-white/[0.09] dark:bg-white/[0.05]";

/** What a visitor sees from the link in their email: confirm first, then manage. */
export default function VisitorRequestStatus({ token }: { token: string }) {
  const request = useVisitorRequest(token);
  const confirm = useConfirmVisitorRequest(token);
  const cancel = useCancelVisitorRequest(token);
  const accept = useAcceptVisitorProposal(token);
  const r = request.data;

  if (request.isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (request.isError || !r) {
    return (
      <div className={card}>
        <h2 className="font-serif text-2xl font-bold text-[#111] dark:text-white">We couldn’t open this request</h2>
        <p className="text-[15px] text-[#3B2A2E] dark:text-white/80">{errorText(request.error, "Check that you opened the whole link from the email.")}</p>
        <Link href="/talk-to-a-pastor" className={btnPrimary}>
          Request a session
        </Link>
      </div>
    );
  }

  const tz = r.requesterTimezone ?? "Africa/Lagos";

  if (r.status === "HOLD") {
    return (
      <div className={card}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
          <MailCheck size={22} aria-hidden="true" />
        </span>
        <h2 className="font-serif text-3xl font-bold text-[#111] dark:text-white">Confirm your request</h2>
        <p className="text-[15px] text-[#3B2A2E] dark:text-white/80">
          {r.requesterName.split(" ")[0]}, you asked to meet <strong>{pastorsOf(r)}</strong> on <strong>{formatWhenLong(r.startsAt, r.endsAt, tz)}</strong>.
          Confirm it and your request will be sent.
        </p>
        <button
          type="button"
          className={btnPrimary}
          disabled={confirm.isPending}
          onClick={async () => {
            try {
              await confirm.mutateAsync(undefined);
              showToast.success("Request sent");
            } catch (err) {
              showToast.error(errorText(err, "Couldn't confirm. Please try again."));
            }
          }}
        >
          {confirm.isPending ? "Confirming…" : "Confirm my request"}
        </button>
      </div>
    );
  }

  const closed = ["DECLINED", "CANCELLED", "LAPSED", "COMPLETED"].includes(r.status);
  if (closed) {
    return (
      <div className={card}>
        <StatusPill request={r} />
        <h2 className="font-serif text-2xl font-bold text-[#111] dark:text-white">
          {r.status === "COMPLETED" ? `Your session with ${pastorsOf(r)}` : `Your request to meet ${pastorsOf(r)}`}
        </h2>
        <p className="text-[15px] tabular-nums text-[#3B2A2E] dark:text-white/80">{formatWhenLong(r.startsAt, r.endsAt, tz)}</p>
        {r.decisionNote && <blockquote className="rounded-xl bg-[#FDF3F5] px-4 py-3 text-sm text-[#3B2A2E] dark:bg-white/[0.05] dark:text-white/80">{r.decisionNote}</blockquote>}
        <Link href="/talk-to-a-pastor" className={r.status === "COMPLETED" ? btnGhost : btnPrimary}>
          Request {r.status === "COMPLETED" ? "another session" : "another time"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <AppointmentView
        request={r}
        timeZone={tz}
        icsHref={visitorIcsHref(token)}
        busy={cancel.isPending || accept.isPending}
        onAccept={async () => {
          try {
            await accept.mutateAsync(undefined);
            showToast.success("Booked. See you then.");
          } catch (err) {
            showToast.error(errorText(err, "Couldn't accept that time."));
          }
        }}
        onCancel={async (reason) => {
          try {
            await cancel.mutateAsync(reason);
            showToast.success(r.status === "APPROVED" ? "Session cancelled" : "Request withdrawn");
            return true;
          } catch (err) {
            showToast.error(errorText(err, "Couldn't cancel."));
            return false;
          }
        }}
        onPickAnother={async () => {
          try {
            await cancel.mutateAsync("Asked for a different time than the one suggested.");
            window.location.assign("/talk-to-a-pastor");
          } catch (err) {
            showToast.error(errorText(err, "Couldn't release that time."));
          }
        }}
      />
    </div>
  );
}
