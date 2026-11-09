import { Loader2 } from "lucide-react";
import type { PublicSlot } from "@/lib/api/prayer-watch";
import { Companions } from "./Companions";
import { MissingDetails } from "./MissingDetails";
import { WatchHourPicker } from "./WatchHourPicker";
import type { WatchSignup } from "./useWatchSignup";

/** Picking a watch hour and committing to it. */
export function SignupForm({ signup, slots }: { signup: WatchSignup; slots: PublicSlot[] | undefined }) {
  const { fields, set, error, submitting, handleSubmit } = signup;
  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-white/45">10 PM – 6 AM · pick your hour</p>
        {slots && <WatchHourPicker slots={slots} value={fields.slotId} onChange={set.slotId} />}
        <Companions slotId={fields.slotId || null} />
      </div>

      <MissingDetails signup={signup} />

      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={fields.agreed}
          onChange={(e) => set.agreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#87102C] dark:accent-[#FFB3C1]"
        />
        <span className="text-xs leading-relaxed text-gray-600 dark:text-white/60">I agree to be committed to this prayer watch hour.</span>
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        Confirm my watch
      </button>
    </form>
  );
}
