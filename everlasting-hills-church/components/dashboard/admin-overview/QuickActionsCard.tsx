import Link from "next/link";
import {
  CalendarCheck,
  CalendarPlus,
  FileBarChart,
  Megaphone,
  Mic,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";
import DashboardCard from "./DashboardCard";

const ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Member", href: "/dashboard/members", icon: UserPlus },
  { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  { label: "Sermon", href: "/dashboard/sermons/new", icon: Mic },
  { label: "Event", href: "/dashboard/events", icon: CalendarPlus },
  { label: "Announcement", href: "/dashboard/announcements", icon: Megaphone },
  { label: "Report", href: "/dashboard/reports", icon: FileBarChart },
];

export default function QuickActionsCard() {
  return (
    <DashboardCard kicker="Shortcuts" title="Quick Actions" icon={Zap}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/40 px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#87102C]/30 hover:bg-[#FFE8ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.18] dark:hover:bg-white/[0.06]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#87102C] text-white transition-transform group-hover:scale-105">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-[#444] dark:text-white/70">
              <span aria-hidden="true">+ </span>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}
