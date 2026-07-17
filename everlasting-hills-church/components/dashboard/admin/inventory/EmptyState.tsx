import { Package } from "lucide-react";

export default function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
      <Package size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {hasAny ? "No items match these filters" : "No inventory items yet"}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {hasAny ? "Try adjusting your search or filters." : "Click New Item to add the first one."}
      </p>
    </div>
  );
}
