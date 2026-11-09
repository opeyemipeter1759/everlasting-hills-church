import { BookOpen, CalendarCheck, CalendarDays, HeartHandshake, UserPlus, Users, type LucideIcon } from "lucide-react";
import type { StatKey, SummaryStat } from "@/lib/types/admin-dashboard";
import DashboardStatCard from "./DashboardStatCard";

const STAT_META: Record<StatKey, { icon: LucideIcon; iconBg: string; iconColor: string; href: string }> = {
  members: { icon: Users, iconBg: "bg-[#FFE8ED] dark:bg-[#87102C]/25", iconColor: "text-[#87102C] dark:text-[#FFB3C1]", href: "/dashboard/admin/members" },
  attendance: { icon: CalendarCheck, iconBg: "bg-emerald-50 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400", href: "/dashboard/analytics/attendance" },
  visitors: { icon: UserPlus, iconBg: "bg-amber-50 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400", href: "/dashboard/admin/first-timers" },
  volunteers: { icon: HeartHandshake, iconBg: "bg-violet-50 dark:bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400", href: "/dashboard/admin/units" },
  events: { icon: CalendarDays, iconBg: "bg-sky-50 dark:bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400", href: "/dashboard/admin/events" },
  sermons: { icon: BookOpen, iconBg: "bg-rose-50 dark:bg-rose-500/15", iconColor: "text-rose-600 dark:text-rose-400", href: "/dashboard/pastor/sermons" },
};

/** Summary stats across the top of the dashboard — each card links to its page. */
export default function StatCardsRow({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => {
        const meta = STAT_META[s.key];
        return (
          <DashboardStatCard
            key={s.key}
            label={s.label}
            value={s.value}
            trend={s.trend}
            note={s.note}
            icon={meta.icon}
            iconBg={meta.iconBg}
            iconColor={meta.iconColor}
            href={meta.href}
          />
        );
      })}
    </div>
  );
}
