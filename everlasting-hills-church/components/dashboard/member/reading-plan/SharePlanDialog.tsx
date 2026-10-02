"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Share2 } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { Select } from "@/components/ui/select";
import { userMessageForError } from "@/lib/api/user-message";
import { useShareReadingPlan, type ReadingPlanSummary } from "@/lib/api/reading-plan";

/**
 * An admin sharing a plan with the whole church.
 *
 * Opened from a plan in the chooser, with that plan already chosen, or from
 * the admin reading page, where the admin picks one. Every member gets a
 * notification that opens the plan; the email is the admin's choice.
 */
export default function SharePlanDialog({
  open,
  plans,
  onClose,
  onShared,
}: {
  open: boolean;
  /** One plan to share it directly, or several to choose from. */
  plans: ReadingPlanSummary[];
  onClose: () => void;
  onShared: (shared: { title: string; recipients: number }) => void;
}) {
  const share = useShareReadingPlan();
  const [planId, setPlanId] = useState("");
  const [note, setNote] = useState("");
  const [byEmail, setByEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every opening starts clean, on the first plan offered.
  useEffect(() => {
    if (!open) return;
    setPlanId("");
    setNote("");
    setByEmail(false);
    setError(null);
  }, [open]);

  const plan = plans.find((candidate) => candidate.id === planId) ?? plans[0] ?? null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan || share.isPending) return;
    setError(null);
    try {
      const result = await share.mutateAsync({ planId: plan.id, note, sendEmail: byEmail });
      onShared({ title: plan.title, recipients: result.recipients });
    } catch (cause) {
      setError(userMessageForError(cause, "Could not share this plan. Please try again."));
    }
  }

  const details = plan
    ? `${plan.durationDays} days${plan.avgMinutesPerDay != null ? ` · about ${plan.avgMinutesPerDay} min/day` : ""}`
    : "";

  return (
    <Modal open={open} onClose={() => { if (!share.isPending) onClose(); }} title="Share with the church">
      {plan && (
        <form onSubmit={submit} className="space-y-4">
          {plans.length > 1 ? (
            <label className="block text-sm font-semibold text-gray-700 dark:text-white/75">
              Plan
              <Select
                aria-label="Plan"
                value={plan.id}
                onChange={setPlanId}
                disabled={share.isPending}
                options={plans.map((option) => ({ value: option.id, label: option.title, hint: `${option.durationDays} days` }))}
                className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal dark:border-white/10 dark:bg-gray-900"
              />
              <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-white/55">{details}</span>
            </label>
          ) : (
            <div>
              <p className="break-words font-serif text-xl font-bold text-gray-900 dark:text-white">{plan.title}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">{details}</p>
            </div>
          )}
          <p className="rounded-xl bg-[#FFF4F6] p-3 text-sm leading-relaxed text-[#6E0C24] dark:bg-[#87102C]/20 dark:text-[#FFB3C1]">
            Every member gets a notification that opens this plan, ready to start, and a push notification if they have turned those on. It also appears in the church announcements.
          </p>
          <label className="block text-sm font-semibold text-gray-700 dark:text-white/75">
            A note from you (optional)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={3}
              disabled={share.isPending}
              placeholder="For example: we start together on Monday."
              className="mt-1.5 block w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 dark:border-white/10 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <label className="flex min-h-11 items-start gap-3 text-sm text-gray-700 dark:text-white/75">
            <input
              type="checkbox"
              checked={byEmail}
              onChange={(event) => setByEmail(event.target.checked)}
              disabled={share.isPending}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#87102C]"
            />
            <span>Also email every member who has an email address</span>
          </label>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={share.isPending} className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 disabled:opacity-50 dark:border-white/10 dark:text-white/70">
              Cancel
            </button>
            <button type="submit" disabled={share.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {share.isPending ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} aria-hidden="true" />}
              {share.isPending ? "Sharing…" : "Share with the church"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
