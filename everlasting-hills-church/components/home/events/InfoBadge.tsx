import type { LucideIcon } from "lucide-react";

export default function InfoBadge({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-[#FFF4F6] px-2.5 py-2">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#87102C]/10 text-[#87102C]">
        <Icon size={13} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#87102C]/70">{label}</p>
        <p className="truncate text-xs font-bold text-[#111]">{children}</p>
      </div>
    </div>
  );
}
