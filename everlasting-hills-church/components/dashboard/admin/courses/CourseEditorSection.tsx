import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

export default function CourseEditorSection({
  icon: Icon,
  label,
  description,
  complete,
  children,
}: {
  icon: LucideIcon;
  label: string;
  /** Short subtitle explaining what this section controls. */
  description?: string;
  /** Shows a filled check badge instead of the icon once this section has real content. */
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 sm:p-6 space-y-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
            complete
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#e8768a]"
          }`}
        >
          {complete ? <Check size={15} /> : <Icon size={15} />}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{label}</h2>
          {description && <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
