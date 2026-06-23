export function StatCard({
  title, iconEl, children,
}: { title: string; iconEl: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</span>
        <div className="text-gray-400 dark:text-gray-500 mt-0.5">{iconEl}</div>
      </div>
      {children}
    </div>
  );
}
