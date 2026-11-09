import { Clock3 } from "lucide-react";
import type { MySignupView, PublicSlot } from "@/lib/api/prayer-watch";
import { serif } from "./sky";
import { watchCardStyle } from "./ui";

/** A sign-up waiting for an admin to approve it. */
export function PendingWatch({ mine, slots }: { mine: MySignupView; slots: PublicSlot[] | undefined }) {
  return (
    <div className="mt-8">
      <div className="relative overflow-hidden rounded-2xl p-5 text-center xs:p-6" style={watchCardStyle(slots, mine.slot.id)}>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-70">
          <Clock3 size={13} aria-hidden="true" />
          Awaiting approval
        </p>
        <h2 style={serif} className="mt-2 text-2xl font-medium xs:text-3xl sm:text-4xl">
          {mine.slot.startTime}–{mine.slot.endTime}
        </h2>
        <p className="mt-1 text-sm opacity-70">{mine.slot.label}</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed opacity-80">
          An admin reviews every sign-up before it&apos;s confirmed. We&apos;ll email you as soon as it is.
        </p>
      </div>
    </div>
  );
}
