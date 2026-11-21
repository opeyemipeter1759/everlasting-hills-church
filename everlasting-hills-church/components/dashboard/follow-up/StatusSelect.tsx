"use client";

import { Clock3 } from "lucide-react";
import toast from "react-hot-toast";
import { useFirstTimerProfile } from "@/lib/api/first-timer-profile";
import { useSetFirstTimerStatus } from "@/lib/api/first-timer-visits";
import { useFollowUpActions, useStageAction } from "@/lib/api/follow-up-stage";
import type { OverrideStatus, PipelineStatus } from "@/lib/api/pipeline";
import { STATUS_META } from "./v2/status";

const CHOICES: OverrideStatus[] = ["FIRST_TIMER", "SECOND_TIMER", "THIRD_TIMER", "FOURTH_TIMER", "AWAY"];
const FOLLOW = "FOLLOW_VISITS";
const OPT_OUT = "OPTED_OUT";
const errorText = (err: unknown) => (err as { message?: string })?.message || "That status could not be saved. Try again.";

/**
 * Where a first-timer stands, which anyone on the team may set by hand. A
 * status set by hand wins over their visits until "Follow their visits" is
 * picked again. Fourth timer asks the team leads to integrate them; Opted out
 * is the usual Opt out, for those allowed it; Integrated stays the leads' approval.
 */
export function StatusSelect({ visitorId, firstName, fallback }: { visitorId: string; firstName: string; fallback: PipelineStatus }) {
  const { data } = useFirstTimerProfile(visitorId);
  const actions = useFollowUpActions(visitorId);
  const setStatus = useSetFirstTimerStatus(visitorId);
  const optOut = useStageAction(visitorId, "opt-out");
  const status = data?.person.status ?? fallback;
  const byHand = data?.person.statusOverride ?? null;
  const busy = setStatus.isPending || optOut.isPending;
  const locked = status === "INTEGRATED" || status === "OPTED_OUT";

  async function pick(value: string) {
    if (value === OPT_OUT) {
      if (window.confirm(`Opt ${firstName} out of follow-up? Their assignee stops following them up.`)) optOut.mutate();
      return;
    }
    const next = value === FOLLOW ? null : (value as OverrideStatus);
    try {
      await setStatus.mutateAsync(next);
      toast.success(next ? `${firstName} is now ${STATUS_META[next].label.toLowerCase()}` : `${firstName} follows their visits again`);
    } catch (err) {
      toast.error(errorText(err));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <label htmlFor={`status-${visitorId}`} className="w-24 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-white/45">
          Status
        </label>
        <span aria-hidden="true" className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_META[status].dot}`} />
        {locked ? (
          <span className="text-sm font-semibold text-[#111] dark:text-white">{STATUS_META[status].label}</span>
        ) : (
          <select
            id={`status-${visitorId}`}
            value={byHand ?? FOLLOW}
            disabled={busy}
            onChange={(e) => pick(e.target.value)}
            className="min-h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-semibold text-[#111] focus:border-[#87102C] focus:outline-none disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            <option value={FOLLOW}>Follow their visits{byHand ? "" : ` (${STATUS_META[status].label})`}</option>
            {CHOICES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
            {actions.data?.canOptOut && <option value={OPT_OUT}>Opted out</option>}
          </select>
        )}
        {busy && <Clock3 size={14} className="flex-shrink-0 animate-pulse text-gray-400" aria-label="Saving" />}
      </div>
      <p className="ml-24 mt-2 text-xs text-gray-400 dark:text-white/35">
        {status === "INTEGRATED"
          ? "Integrated by the team leads' approval."
          : status === "OPTED_OUT"
            ? "Restore them from their profile to change this."
            : byHand
              ? "Set by hand, so new visits won't change it. Fourth timer asks the team leads to integrate them."
              : "Follows their visits. Pick a status to set it by hand; Fourth timer asks the team leads to integrate them."}
      </p>
    </div>
  );
}
