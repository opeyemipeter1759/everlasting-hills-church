import { CheckCircle2, Clock, Eye, XCircle } from "lucide-react";
import { useUpdateWelfareRequestStatus, type WelfareRequestRow, type WelfareStatus } from "@/lib/api/welfare";
import { showToast } from "@/components/ui/toast/toast";
import { errorMessage, STATUS_STYLE } from "./shared";

const OUTLINE_BTN =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-white/60 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50";

/** The next steps for a request: start review, resolve or decline while open; reopen once closed. */
export default function WelfareStatusActions({ r }: { r: WelfareRequestRow }) {
  const updateStatus = useUpdateWelfareRequestStatus();

  async function setStatus(status: WelfareStatus) {
    try {
      await updateStatus.mutateAsync({ id: r.id, status });
      showToast.success(`Marked ${STATUS_STYLE[status].label.toLowerCase()}`);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't update status"));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {r.status === "PENDING" && (
        <button
          type="button"
          onClick={() => setStatus("IN_REVIEW")}
          disabled={updateStatus.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Eye size={13} /> Start review
        </button>
      )}
      {(r.status === "PENDING" || r.status === "IN_REVIEW") && (
        <>
          <button
            type="button"
            onClick={() => setStatus("RESOLVED")}
            disabled={updateStatus.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 size={13} /> Mark resolved
          </button>
          <button type="button" onClick={() => setStatus("DECLINED")} disabled={updateStatus.isPending} className={OUTLINE_BTN}>
            <XCircle size={13} /> Decline
          </button>
        </>
      )}
      {(r.status === "RESOLVED" || r.status === "DECLINED") && (
        <button type="button" onClick={() => setStatus("PENDING")} disabled={updateStatus.isPending} className={OUTLINE_BTN}>
          <Clock size={13} /> Reopen
        </button>
      )}
    </div>
  );
}
