import { HandHeart, Loader2, Search } from "lucide-react";
import type { WelfareRequestRow } from "@/lib/api/welfare";
import { EMPTY_BOX } from "./shared";
import WelfareCard from "./WelfareCard";
import type { WelfareFilterState } from "./useWelfareFilters";

/** The requests grouped by day, or a spinner, error or empty message. */
export default function WelfareList({ isLoading, isError, total, f, onDelete }: {
  isLoading: boolean;
  isError: boolean;
  /** How many requests were loaded before filtering. */
  total: number;
  f: WelfareFilterState;
  onDelete: (r: WelfareRequestRow) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }
  if (isError) {
    return (
      <p className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
        Couldn&apos;t load welfare requests.
      </p>
    );
  }
  if (total === 0) {
    return (
      <div className={EMPTY_BOX}>
        <HandHeart size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-base font-semibold text-gray-700 dark:text-white/80">No welfare requests yet.</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Submissions from the public welfare request form will show up here.</p>
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
              <WelfareCard key={r.id} r={r} onDelete={() => onDelete(r)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
