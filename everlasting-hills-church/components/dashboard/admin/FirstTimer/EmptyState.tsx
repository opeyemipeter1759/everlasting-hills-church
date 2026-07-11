import { UserPlus } from "lucide-react";

export default function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center mb-3">
        <UserPlus size={20} className="text-[#87102C] dark:text-[#FFB3C1]" />
      </div>
      <p className="text-sm font-semibold text-[#111] dark:text-white/70">
        {hasAny ? "No results match your search." : "No first-timer submissions yet."}
      </p>
      <p className="text-xs text-[#8a7e80] dark:text-white/35 mt-1">
        {hasAny ? "Try adjusting your search or filter." : "First timers will appear here after form submission."}
      </p>
    </div>
  );
}
