"use client";

import { Check, X } from "lucide-react";
import type { PendingStatusChange } from "@/lib/api/follow-up-pipeline";
import { MasterStatusBadge } from "./MasterStatusBadge";
import { RowAvatar } from "./table-bits";

function when(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** One waiting change: who it is about, what is being asked, and the decision. */
export function PendingRow({
  request,
  busy,
  onOpen,
  onDecide,
}: {
  request: PendingStatusChange;
  busy: boolean;
  onOpen: () => void;
  onDecide: (approve: boolean) => void;
}) {
  return (
    <article className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <RowAvatar name={request.name} photoUrl={null} />

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-[#111] hover:underline dark:text-white">{request.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <MasterStatusBadge status={request.fromStatus} />
          <span aria-hidden="true" className="text-gray-400">&rarr;</span>
          <MasterStatusBadge status={request.toStatus} />
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-white/45">
          Asked by {request.requestedBy} &middot; {when(request.requestedAt)}
          {request.note ? ` — "${request.note}"` : ""}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]">See their details &rarr;</p>
      </button>

      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onDecide(false)}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <X size={15} aria-hidden="true" />
          Reject
        </button>
        <button
          type="button"
          onClick={() => onDecide(true)}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl bg-[#87102C] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-50"
        >
          <Check size={15} aria-hidden="true" />
          Approve
        </button>
      </div>
    </article>
  );
}
