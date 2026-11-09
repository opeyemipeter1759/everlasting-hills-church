import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import SharePlanDialog from "@/components/dashboard/member/reading-plan/SharePlanDialog";
import { plural } from "./shared";
import type { ReadingMonitorPage } from "./useReadingMonitorPage";

/** Confirm clearing gone quiet, confirm removing one plan, and share a plan. */
export default function ReadingDialogs({ m }: { m: ReadingMonitorPage }) {
  const { clearable, removing } = m;
  return (
    <>
      {clearable && (
        <ConfirmDialog
          open={m.confirmingClear}
          tone="danger"
          title="Clear gone quiet?"
          description={`This removes ${plural(clearable.plans, "plan")} from ${plural(clearable.members, "member")} who have read nothing in the last 7 days. Plans started this week stay. Nothing is deleted: their reading history stays, and they can choose a plan again at any time.`}
          confirmLabel={`Remove ${plural(clearable.plans, "plan")}`}
          cancelLabel="Keep them"
          loading={m.clearGoneQuiet.isPending}
          onConfirm={m.confirmClear}
          onCancel={() => m.setConfirmingClear(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        tone="danger"
        title={removing ? `Remove ${removing.plan.title} from ${removing.reader.name}?` : "Remove this plan?"}
        description="It leaves their plans and this page. The days they have read stay in their history, and they can choose the plan again at any time."
        confirmLabel="Remove plan"
        cancelLabel="Keep it"
        loading={m.removeMemberPlan.isPending}
        onConfirm={m.confirmRemovePlan}
        onCancel={() => m.setRemoving(null)}
      />

      <SharePlanDialog
        open={m.shareOpen}
        plans={m.plans.data ?? []}
        loading={m.plans.isLoading}
        onClose={() => m.setShareOpen(false)}
        onShared={(result) => {
          m.setShared(result);
          m.setShareOpen(false);
        }}
      />
    </>
  );
}
