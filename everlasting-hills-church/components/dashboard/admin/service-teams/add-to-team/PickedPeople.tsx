import { X } from "lucide-react";
import type { AddToTeamState } from "./useAddToTeam";

/** The people picked so far, as removable chips. */
export default function PickedPeople({ s }: { s: AddToTeamState }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-white/50">
        People {s.picked.length > 0 && `(${s.picked.length})`}
      </label>
      {s.picked.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-white/30">Nobody picked yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {s.picked.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#FFF4F6] px-2.5 py-1 text-xs font-semibold text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#FFB3C1]"
            >
              {p.name}
              <button type="button" aria-label={`Remove ${p.name}`} onClick={() => s.unpick(p.id)} className="opacity-60 hover:opacity-100">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
