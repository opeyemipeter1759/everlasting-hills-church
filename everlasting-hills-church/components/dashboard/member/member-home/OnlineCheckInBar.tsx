"use client";

import { useState } from "react";
import { Check, Wifi } from "lucide-react";
import { useOnlineCheckIn } from "@/lib/api";

/**
 * For a member watching from home rather than in the building. Separate from
 * the in-person CheckInPanel above — someone can be marked present either
 * way, and both should count as attendance from the admin's point of view.
 */
export function OnlineCheckInBar() {
  const onlineCheckIn = useOnlineCheckIn();
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    try {
      await onlineCheckIn.mutateAsync();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't check you in. Please try again.");
    }
  }

  const checkedIn = onlineCheckIn.isSuccess;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a]">
          <Wifi size={14} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Watching online today?</p>
          <p className="text-xs text-gray-500 dark:text-white/40">Let us know you're joining the service online.</p>
        </div>
      </div>

      {checkedIn ? (
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Check size={13} /> Checked in
        </span>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={onlineCheckIn.isPending}
          className="self-start sm:self-auto rounded-xl bg-[#87102C] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
        >
          {onlineCheckIn.isPending ? "Checking in…" : "I'm watching online"}
        </button>
      )}

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
