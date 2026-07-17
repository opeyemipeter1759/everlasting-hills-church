import { CheckCircle, Trash2, Clock, MapPin } from "lucide-react";
import type { HomeCell } from "./useHomeCells";

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
        <MapPin size={20} className="text-gray-300 dark:text-white/20" />
      </div>
      <p className="text-sm font-semibold text-gray-400 dark:text-white/30">No cells found</p>
    </div>
  );
}

export default function HomeCellTable({
  items, isLoading, onApprove, onDelete,
}: {
  items: HomeCell[];
  isLoading: boolean;
  onApprove: (c: HomeCell) => void;
  onDelete: (c: HomeCell) => void;
}) {
  if (isLoading) return <Skeleton />;
  if (!items.length) return <EmptyState />;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
      {/* header row */}
      <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/[0.06]">
        {["Cell", "Leader", "Venue", "Schedule", ""].map((h, i) => (
          <span key={i} className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-white/25">{h}</span>
        ))}
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {items.map((cell) => (
          <div
            key={cell.id}
            className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-3 sm:gap-4 px-5 py-4 items-center hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
          >
            {/* Cell name + status */}
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{cell.name}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                  cell.isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {cell.isActive ? "Active" : "Pending"}
                </span>
              </div>
            </div>

            {/* Leader */}
            <div>
              <p className="text-sm text-gray-700 dark:text-white/70 truncate">{cell.leaderName}</p>
              {cell.leaderPhone && (
                <p className="text-xs text-gray-400 dark:text-white/30 truncate">{cell.leaderPhone}</p>
              )}
            </div>

            {/* Venue */}
            <div className="flex items-start gap-1.5">
              <MapPin size={12} className="text-gray-300 dark:text-white/25 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-500 dark:text-white/50 text-ellipsis overflow-hidden line-clamp-2">{cell.address}</p>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gray-300 dark:text-white/25 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 dark:text-white/70">{cell.meetingDay}</p>
                <p className="text-xs text-gray-400 dark:text-white/30">{cell.meetingTime}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              {!cell.isActive && (
                <button
                  onClick={() => onApprove(cell)}
                  title="Approve"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                >
                  <CheckCircle size={13} /> Approve
                </button>
              )}
              <button
                onClick={() => onDelete(cell)}
                title="Delete"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 dark:text-white/30 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
