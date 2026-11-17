"use client";

import { useState } from "react";
import { useRequestApproval } from "@/lib/api/approvals";
import { firstProblem, requestApprovalSchema } from "@/lib/follow-up/approval-schema";

/** "Request approval" with an optional note for the team leads. */
export default function ApprovalRequestForm({ visitorId, again, onDone }: { visitorId: string; again: boolean; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const request = useRequestApproval();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { visitorId, note: note.trim() || null };
    const problem = firstProblem(requestApprovalSchema, input);
    setError(problem);
    if (problem) return;
    request.mutate(input, {
      onSuccess: () => {
        setNote("");
        onDone();
      },
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <p className="text-sm text-gray-600 dark:text-white/60">
        {again
          ? "When the changes are done, ask the team leads again."
          : "When they are settled in, ask the team leads to approve their integration."}
      </p>
      <label className="block">
        <span className="text-xs font-medium text-gray-600 dark:text-white/55">Note for the team leads (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="How they are doing, and anything the team leads should know"
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        />
      </label>
      {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <button
        type="submit"
        disabled={request.isPending}
        className="h-11 w-full rounded-xl bg-[#87102C] px-5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-60 sm:w-auto"
      >
        {request.isPending ? "Asking..." : again ? "Ask again" : "Request approval"}
      </button>
    </form>
  );
}
