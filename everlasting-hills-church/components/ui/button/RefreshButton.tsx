"use client";

import { RefreshCw } from "lucide-react";

const VARIANT_CLASSES = {
  // Matches the refresh button already used across admin consoles (People, Roles, etc).
  light:
    "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5",
  // For use on dark/gradient hero backgrounds — matches the translucent stat pills there.
  dark: "border border-white/15 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/15",
};

/** Small "Refresh" pill with a spinning icon while fetching. */
export default function RefreshButton({
  onRefresh,
  isRefreshing = false,
  label = "Refresh",
  variant = "light",
  className = "",
}: {
  onRefresh: () => void;
  isRefreshing?: boolean;
  label?: string;
  variant?: "light" | "dark";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
      {label}
    </button>
  );
}
