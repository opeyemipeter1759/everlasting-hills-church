import type { LucideIcon } from "lucide-react";

export default function CourseEditorSection({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-[#87102C] dark:text-[#e8768a]" />
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">{label}</h2>
      </div>
      {children}
    </div>
  );
}
