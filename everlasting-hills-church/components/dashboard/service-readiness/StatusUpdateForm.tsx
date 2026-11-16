import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { ReadinessStatus } from "@/lib/api/service-readiness-plans";
import { usePostReadinessUpdate } from "@/lib/api/service-readiness-updates";

/** After the plan is in: tell the Administrator everything is ready, or that there's a blocker (and what it is). */
export default function StatusUpdateForm({ serviceId, unitId }: { serviceId: string; unitId: string }) {
  const post = usePostReadinessUpdate();
  const [status, setStatus] = useState<ReadinessStatus | null>(null);
  const [note, setNote] = useState("");
  const blocked = status === "BLOCKED";
  const noteId = `${serviceId}-${unitId}-note`;

  function send() {
    if (!status) return;
    if (blocked && !note.trim()) return showToast.error("Say what the blocker is.");
    post.mutate(
      { serviceId, unitId, status, note: note.trim() || undefined },
      {
        onSuccess: () => {
          showToast.success(blocked ? "Blocker sent to the Administrator." : "Marked ready. The Administrator has been told.");
          setStatus(null);
          setNote("");
        },
        onError: (err) => showToast.error((err as { message?: string }).message ?? "Couldn't send the update."),
      },
    );
  }

  const choice = (value: ReadinessStatus, label: string, Icon: typeof CheckCircle2, on: string) => (
    <button
      type="button"
      aria-pressed={status === value}
      onClick={() => setStatus(value)}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${status === value ? on : "border-gray-200 text-gray-600 dark:border-white/10 dark:text-white/65"}`}
    >
      <Icon size={15} aria-hidden="true" /> {label}
    </button>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); send(); }} className="grid gap-2">
      <p className="text-xs font-semibold text-gray-600 dark:text-white/60">Post an update</p>
      <div className="flex flex-wrap gap-2">
        {choice("READY", "Everything is ready", CheckCircle2, "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200")}
        {choice("BLOCKED", "There's a blocker", AlertTriangle, "border-red-600 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200")}
      </div>
      {status && (
        <>
          <label htmlFor={noteId} className="text-xs font-semibold text-gray-600 dark:text-white/60">
            {blocked ? "What's the blocker?" : "Note (optional)"}
          </label>
          <textarea
            id={noteId}
            rows={2}
            value={note}
            required={blocked}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#87102C]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          />
          <button type="submit" disabled={post.isPending} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-bold text-white hover:bg-[#6E0C24] disabled:opacity-60">
            {post.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Send update
          </button>
        </>
      )}
    </form>
  );
}
