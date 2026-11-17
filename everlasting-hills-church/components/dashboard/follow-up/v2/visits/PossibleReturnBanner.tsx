"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { PipelineRow } from "@/lib/api/pipeline";
import { usePossibleReturn, useResolvePossibleReturn } from "@/lib/api/first-timer-visits";
import { shortDate } from "../status";

const errorText = (err: unknown) => (err as { message?: string })?.message || "That did not save. Try again.";

/**
 * A form that came in with a phone or email the church already has. Families
 * share phones, so staff decide; records are never merged. Same person puts a
 * visit on the original and archives this form; Different person keeps both.
 */
export function PossibleReturnBanner({ person }: { person: PipelineRow }) {
  const router = useRouter();
  const match = usePossibleReturn(person.visitorId, person.possibleReturn);
  const resolve = useResolvePossibleReturn(person.visitorId);
  const [confirming, setConfirming] = useState(false);
  if (!match.data?.pending) return null;

  const { visitor, member } = match.data;
  const who = visitor
    ? `${visitor.firstName} ${visitor.lastName}, who first came on ${shortDate(visitor.firstVisitDate)}`
    : member
      ? `${member.firstName} ${member.lastName}, a member`
      : "someone already on record";
  const original = visitor ? `${visitor.firstName} ${visitor.lastName}` : member ? `${member.firstName} ${member.lastName}` : "the earlier record";

  async function decide(decision: "confirm" | "dismiss") {
    try {
      const result = await resolve.mutateAsync(decision);
      if (decision === "dismiss") return void toast.success(`${person.firstName} stays a separate person`);
      setConfirming(false);
      toast.success(visitor ? `Visit added to ${original}` : `Noted on ${original}'s follow-up thread`);
      router.replace(result.originalVisitorId ? `/dashboard/follow-up/person/${result.originalVisitorId}` : "/dashboard/follow-up/overview");
    } catch (err) {
      toast.error(errorText(err));
    }
  }

  return (
    <section aria-label="Possible return visit" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/[0.08]">
      <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Possible return visit</h2>
      <p className="mt-1 text-sm text-amber-900/85 dark:text-amber-100/80">
        This form&apos;s phone or email matches {who}. Families often share a phone, so check before you choose.
      </p>
      {visitor && (
        <Link href={`/dashboard/follow-up/person/${visitor.id}`} className="mt-1 inline-block text-sm font-semibold text-amber-900 underline dark:text-amber-200">
          See {visitor.firstName}&apos;s profile
        </Link>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={resolve.isPending}
          className="min-h-[40px] rounded-lg bg-amber-700 px-4 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          Same person
        </button>
        <button
          type="button"
          onClick={() => decide("dismiss")}
          disabled={resolve.isPending}
          className="min-h-[40px] rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
        >
          Different person
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        tone="warning"
        title="Is this the same person?"
        description={
          visitor
            ? `${original} gets a visit on ${shortDate(person.firstVisitDate)}, and this form is archived. Nothing is merged or deleted.`
            : `${original} has no first-timer form to add a visit to, so it is noted on their follow-up thread and this form is archived. Nothing is merged or deleted.`
        }
        confirmLabel="Yes, same person"
        loading={resolve.isPending}
        onConfirm={() => decide("confirm")}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
