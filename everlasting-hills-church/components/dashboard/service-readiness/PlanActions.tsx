import { useState } from "react";
import { CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { MyReadinessItem } from "@/lib/api/service-readiness-plans";
import { useSendReadinessPlan } from "@/lib/api/service-readiness-updates";
import UpdatesTimeline from "@/components/dashboard/admin/service-readiness/UpdatesTimeline";
import { lagosWhen } from "@/components/dashboard/admin/service-readiness/when";
import StatusUpdateForm from "./StatusUpdateForm";

/** The foot of a unit's plan: send it, then see approval and post updates. */
export default function PlanActions({ item }: { item: MyReadinessItem }) {
  const send = useSendReadinessPlan();
  const [showUpdates, setShowUpdates] = useState(false);
  const { service, unit, plan } = item;
  const where = { serviceId: service.id, unitId: unit.id };

  if (plan.state === "NOT_STARTED") {
    const empty = plan.tasks.length === 0;
    return (
      <footer className="flex flex-wrap items-center gap-3 bg-gray-50 px-5 py-4 dark:bg-white/[0.02]">
        <p className="min-w-0 flex-1 text-xs text-gray-500 dark:text-white/45">
          {empty ? "Add your tasks, then send the plan." : "Happy with the list? Send it to the Administrator for approval."}
        </p>
        <button
          type="button"
          disabled={empty || send.isPending}
          onClick={() =>
            send.mutate(where, {
              onSuccess: () => showToast.success("Plan sent to the Administrator."),
              onError: (err) => showToast.error((err as { message?: string }).message ?? "Couldn't send the plan."),
            })
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#6E0C24] disabled:opacity-40"
        >
          {send.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
          Send plan
        </button>
      </footer>
    );
  }

  const approved = !!plan.approvedAt;
  return (
    <footer className="space-y-4 bg-gray-50 px-5 py-4 dark:bg-white/[0.02]">
      <p className={`flex items-center gap-2 text-sm font-semibold ${approved ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
        {approved ? <CheckCircle2 size={16} aria-hidden="true" /> : <Clock size={16} aria-hidden="true" />}
        {approved ? `Approved by ${plan.approvedBy ?? "the Administrator"} · ${lagosWhen(plan.approvedAt)}` : "Sent · waiting for the Administrator's approval"}
      </p>
      <StatusUpdateForm {...where} />
      {plan.updates.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowUpdates((v) => !v)} className="text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
            {showUpdates ? "Hide updates" : `Show updates (${plan.updates.length})`}
          </button>
          {showUpdates && <div className="mt-2"><UpdatesTimeline updates={plan.updates} /></div>}
        </div>
      )}
    </footer>
  );
}
