import { Check, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { useApproveReadinessPlan } from "@/lib/api/service-readiness-updates";

/** Approves one unit's submitted plan for a service. */
export default function ApproveButton({ serviceId, unitId, unitName }: { serviceId: string; unitId: string; unitName: string }) {
  const approve = useApproveReadinessPlan();
  return (
    <button
      type="button"
      disabled={approve.isPending}
      aria-label={`Approve ${unitName}'s plan`}
      onClick={() =>
        approve.mutate(
          { serviceId, unitId },
          {
            onSuccess: () => showToast.success(`${unitName}'s plan approved.`),
            onError: (err) => showToast.error((err as { message?: string }).message ?? "Couldn't approve the plan."),
          },
        )
      }
      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#87102C] px-3 text-xs font-bold text-white hover:bg-[#6E0C24] disabled:opacity-60"
    >
      {approve.isPending ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
      Approve
    </button>
  );
}
