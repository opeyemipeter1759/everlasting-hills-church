import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "No data",
  description = "Nothing to display yet.",
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center ${compact ? "py-6" : "py-12"}`}>
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 max-w-[220px] mx-auto">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
