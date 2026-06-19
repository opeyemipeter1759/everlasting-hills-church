export function SectionCard({
  title, iconEl, action, children,
}: { title: string; iconEl: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
            <div className="text-[#87102C]">{iconEl}</div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
