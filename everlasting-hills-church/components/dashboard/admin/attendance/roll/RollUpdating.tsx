import { Loader2 } from "lucide-react";

/** Dims the rows already shown while the next set loads, so the table never flashes empty. */
export default function RollUpdating() {
  return (
    <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-10 dark:bg-[#1c1c1e]/50">
      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow dark:border-white/10 dark:bg-[#2a2a2e] dark:text-gray-400">
        <Loader2 size={12} className="animate-spin text-[#87102C]" /> Updating
      </span>
    </div>
  );
}
