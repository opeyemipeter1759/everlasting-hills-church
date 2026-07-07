import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PanelHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  badge?: ReactNode;
}

export default function PanelHeader({ icon: Icon, eyebrow, title, badge }: PanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-5 py-4"
      style={{ background: "linear-gradient(135deg, #2a0410 0%, #4a0819 50%, #87102C 100%)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
          <Icon size={15} className="text-[#FFB3C1]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFB3C1]/70">{eyebrow}</p>
          <h3 className="truncate text-sm font-bold text-white">{title}</h3>
        </div>
      </div>
      {badge}
    </div>
  );
}
