import { CheckCircle2, Heart, Search } from "lucide-react";
import type { PrayerRequestRow } from "@/lib/api/prayer-requests";
import { EMPTY_BOX } from "./shared";
import RequestCard from "./RequestCard";
import type { RequestFilterState } from "./useRequestFilters";

/** The requests grouped by day, or the right message when there are none to show. */
export default function RequestList({ isError, total, f, onDelete }: {
  isError: boolean;
  /** How many requests were loaded before filtering. */
  total: number;
  f: RequestFilterState;
  onDelete: (r: PrayerRequestRow) => void;
}) {
  if (isError) {
    return (
      <p className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
        Couldn&apos;t load prayer requests.
      </p>
    );
  }
  if (total === 0) {
    return (
      <div className={EMPTY_BOX}>
        <Heart size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-base font-semibold text-gray-700 dark:text-white/80">No prayer requests yet.</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Submissions from the public prayer request form will show up here.</p>
      </div>
    );
  }
  if (f.filtered.length === 0 && !f.hasFilters && f.status === "") {
    return (
      <div className={EMPTY_BOX}>
        <CheckCircle2 size={26} className="mx-auto mb-3 text-emerald-300 dark:text-emerald-500/40" />
        <p className="text-base font-semibold text-gray-700 dark:text-white/80">All caught up.</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Every prayer request has been prayed for — see the &quot;Prayed for&quot; tab.</p>
      </div>
    );
  }
  if (f.filtered.length === 0) {
    return (
      <div className={EMPTY_BOX}>
        <Search size={24} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-base font-semibold text-gray-700 dark:text-white/80">No requests match your filters.</p>
        <button type="button" onClick={f.clearFilters} className="mt-2 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]">
          Clear filters
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {f.groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
            {group.label} <span className="font-semibold normal-case text-gray-300 dark:text-white/25">· {group.items.length}</span>
          </h2>
          <div className="space-y-3">
            {group.items.map((r) => (
              <RequestCard key={r.id} r={r} onDelete={() => onDelete(r)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
