"use client";

import { Users } from "lucide-react";
import { useSlotCompanions } from "@/lib/api/prayer-watch";

/** "N others are on this hour" — the shared-vigil nudge, never names beyond first names. */
export function Companions({ slotId, className = "justify-start text-gray-500 dark:text-white/45" }: { slotId: string | null; className?: string }) {
  const companions = useSlotCompanions(slotId);
  if (!slotId || companions.isLoading || !companions.data || companions.data.count === 0) return null;
  const { count, firstNames } = companions.data;
  const shown = firstNames.slice(0, 3).join(", ");
  const rest = count - Math.min(3, firstNames.length);
  return (
    <p className={`mt-2 flex items-center gap-1.5 text-xs ${className}`}>
      <Users size={13} className="shrink-0" aria-hidden="true" />
      {shown}
      {rest > 0 ? ` and ${rest} other${rest === 1 ? "" : "s"}` : ""} already on this hour.
    </p>
  );
}
