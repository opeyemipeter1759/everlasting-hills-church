import { AlertCircle, CalendarClock, RefreshCw } from "lucide-react";
import type { Gathering } from "@/lib/api/gatherings";
import GatheringCard from "./GatheringCard";
import type { GatheringFilter } from "./types";

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 space-y-3"
        >
          <div className="h-4 w-1/3 rounded bg-gray-100 dark:bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: GatheringFilter }) {
  const label =
    filter === "ACTIVE"
      ? "Nothing running right now — every gathering is paused."
      : filter === "INACTIVE"
        ? "Nothing paused. Every gathering is visible to members."
        : "No gatherings yet — click New to schedule the first one.";

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-14 text-center">
      <CalendarClock size={28} className="mx-auto text-gray-200 dark:text-white/10 mb-3" />
      <p className="text-sm text-gray-400 dark:text-white/40">{label}</p>
    </div>
  );
}

/**
 * A failed load is shown as a retry rather than an empty list: "no gatherings"
 * and "we could not ask" look identical otherwise, and the first would have an
 * admin creating a duplicate of a gathering that already exists.
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-red-200 dark:border-red-500/20 py-14 text-center">
      <AlertCircle size={28} className="mx-auto text-red-300 dark:text-red-500/30 mb-3" />
      <p className="text-sm text-gray-500 dark:text-white/50">Could not load gatherings.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
      >
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}

export default function GatheringsList({
  items,
  isLoading,
  isError,
  onRetry,
  filter,
  onEdit,
  onDelete,
  onToggleActive,
  busy,
}: {
  items: Gathering[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  filter: GatheringFilter;
  onEdit: (g: Gathering) => void;
  onDelete: (g: Gathering) => void;
  onToggleActive: (g: Gathering) => void;
  busy: boolean;
}) {
  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (items.length === 0) return <EmptyState filter={filter} />;

  return (
    <div className="space-y-3">
      {items.map((gathering) => (
        <GatheringCard
          key={gathering.id}
          gathering={gathering}
          onEdit={() => onEdit(gathering)}
          onDelete={() => onDelete(gathering)}
          onToggleActive={() => onToggleActive(gathering)}
          busy={busy}
        />
      ))}
    </div>
  );
}
