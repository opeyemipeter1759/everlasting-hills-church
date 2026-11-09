"use client";

import { useState } from "react";
import type { MySignupView, PublicSlot } from "@/lib/api/prayer-watch";
import { Companions } from "./Companions";
import { FamilyChangePanel } from "./FamilyChangePanel";
import { WatchLinks } from "./WatchLinks";
import { serif } from "./sky";
import { watchCardStyle } from "./ui";

/** A confirmed watcher's hour, the ways in, and a request to move to another family. */
export function ConfirmedWatch({ mine, slots }: { mine: MySignupView; slots: PublicSlot[] | undefined }) {
  // The panel is remounted (fresh choice and reason) each time it opens.
  const [requestingChange, setRequestingChange] = useState(false);
  const pending = mine.pendingFamilyChangeRequest;

  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-2xl p-5 text-center xs:p-6" style={watchCardStyle(slots, mine.slot.id)}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{mine.leadsWatch ? "You lead this watch" : "You’re on the watch"}</p>
        <h2 style={serif} className="mt-2 text-2xl font-medium xs:text-3xl sm:text-4xl">
          {mine.slot.startTime}–{mine.slot.endTime}
        </h2>
        <p className="mt-1 text-sm opacity-70">{mine.slot.label}</p>
        <Companions slotId={mine.slot.id} className="justify-center opacity-70" />

        <WatchLinks mine={mine} />

        {pending ? (
          <p className="mt-4 text-xs font-medium opacity-70">
            Request pending: move to {pending.toSlotTime} ({pending.toSlotLabel}) — awaiting admin review.
          </p>
        ) : (
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setRequestingChange((v) => !v)}
              className="inline-flex min-h-11 items-center px-2 text-xs font-semibold underline opacity-70 transition-opacity hover:opacity-100"
            >
              {requestingChange ? "Never mind" : "Request to change my Prayer Watchmen Family"}
            </button>
          </div>
        )}
      </div>

      {requestingChange && slots && <FamilyChangePanel mine={mine} slots={slots} onSent={() => setRequestingChange(false)} />}
    </div>
  );
}
