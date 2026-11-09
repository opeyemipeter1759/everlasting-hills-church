"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { userMessageForError } from "@/lib/api/user-message";
import { useRequestFamilyChange, type MySignupView, type PublicSlot } from "@/lib/api/prayer-watch";
import { WatchHourPicker } from "./WatchHourPicker";
import { fieldCls } from "./ui";

/** Choosing another watch hour to move to, with an optional reason, sent for an admin to decide. */
export function FamilyChangePanel({ mine, slots, onSent }: { mine: MySignupView; slots: PublicSlot[]; onSent: () => void }) {
  const requestChange = useRequestFamilyChange();
  const [slotId, setSlotId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!slotId) return;
    setError(null);
    try {
      await requestChange.mutateAsync({ id: mine.signup.id, toSlotId: slotId, reason: reason.trim() || undefined });
      onSent();
    } catch (err) {
      setError(userMessageForError(err, "Couldn't send your request. Please try again."));
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <WatchHourPicker
        slots={slots.filter((s) => s.id !== mine.slot.id)}
        value={slotId}
        onChange={setSlotId}
        disabled={requestChange.isPending}
      />
      {slotId && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <label className="block text-xs font-medium text-gray-500 dark:text-white/45">Why are you changing? (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. my work shift changed"
            rows={2}
            className={`${fieldCls} resize-none`}
          />
          <button
            type="button"
            onClick={send}
            disabled={requestChange.isPending}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {requestChange.isPending && <Loader2 size={15} className="animate-spin" />}
            Send request
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
