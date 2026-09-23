"use client";

import { RefreshCw } from "lucide-react";

/** How much of the church's follow-up list has been reached this week. */
export function WeekProgress({ percent, reached, total }: { percent: number; reached: number; total: number }) {
  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-3 text-xs">
        <span className="font-medium text-white/80">
          {reached} of {total} reached this week
        </span>
        <span className="font-bold tabular-nums text-white">{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15" role="presentation">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FFB3C1] to-white transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
    </div>
  );
}

export function RefreshButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="Refresh"
      title="Refresh"
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20 disabled:opacity-60"
    >
      <RefreshCw size={16} className={busy ? "animate-spin" : ""} aria-hidden="true" />
    </button>
  );
}

/** "just now" / "4 min ago" — how fresh the figures above are. */
export function freshness(updatedAt: number): string {
  if (!updatedAt) return "";
  const minutes = Math.floor((Date.now() - updatedAt) / 60000);
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 min ago";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "Updated 1 hour ago" : `Updated ${hours} hours ago`;
}
