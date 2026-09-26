"use client";

import { MessageCircle } from "lucide-react";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";

/**
 * A person's activity thread at a glance: how many messages have been logged
 * so far, and — in the church's colour — how many are new to you since you
 * last opened it.
 */
export function ActivityBadge({ activity }: { activity: MasterListRow["activity"] }) {
  const total = activity?.total ?? 0;
  const unread = activity?.unread ?? 0;
  const label =
    total === 0
      ? "No activity yet"
      : `${total} ${total === 1 ? "activity" : "activities"} logged${unread > 0 ? `, ${unread} unread` : ""}`;

  return (
    <span aria-label={label} title={label} className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-1 text-xs font-semibold ${
          total === 0 ? "text-gray-400 dark:text-white/30" : "text-gray-600 dark:text-white/60"
        }`}
      >
        <MessageCircle size={14} />
        {total}
      </span>
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-1 rounded-full bg-[#87102C] px-2 py-0.5 text-[11px] font-bold text-white"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          {unread > 99 ? "99+" : unread} new
        </span>
      )}
    </span>
  );
}
