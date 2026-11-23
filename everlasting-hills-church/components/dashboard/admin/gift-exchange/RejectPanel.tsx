import { useState } from "react";
import { Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { useRejectGiftEntry, type GiftEntry } from "@/lib/api/gift-exchange";

/** Confirms a rejection, with an optional reason the member will see. */
export default function RejectPanel({ entry, onClose }: { entry: GiftEntry; onClose: () => void }) {
  const reject = useRejectGiftEntry();
  const [reason, setReason] = useState("");
  const id = `reject-reason-${entry.id}`;

  return (
    <form
      className="mt-3 space-y-3 rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-500/25 dark:bg-red-500/[0.06]"
      onSubmit={(e) => {
        e.preventDefault();
        reject.mutate(
          { id: entry.id, reason: reason.trim() || undefined },
          {
            onSuccess: () => { showToast.success(`${entry.name} won't be paired.`); onClose(); },
            onError: (err) => showToast.error((err as { message?: string }).message ?? "Couldn't reject. Please try again."),
          },
        );
      }}
    >
      <p className="text-sm font-bold text-red-800 dark:text-red-200">Reject {entry.name}?</p>
      <p className="text-xs text-red-700/80 dark:text-red-200/70">
        They won&apos;t be paired, and they can&apos;t join again unless you reinstate them.
      </p>
      <div>
        <label htmlFor={id} className="text-xs font-semibold text-gray-700 dark:text-white/70">Reason (optional, shown to the member)</label>
        <textarea id={id} rows={2} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Please complete the membership class first"
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
        <p className="text-right text-[11px] text-gray-400">{reason.length}/300</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={reject.isPending}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">
          {reject.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Reject
        </button>
        <button type="button" onClick={onClose} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-gray-600 hover:bg-white dark:text-white/60 dark:hover:bg-white/10">
          Cancel
        </button>
      </div>
    </form>
  );
}
