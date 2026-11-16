"use client";

import { RefreshCw } from "lucide-react";

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
