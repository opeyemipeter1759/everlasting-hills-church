import { Activity, BookOpen, ClipboardCheck, HandHeart, UserPlus, type LucideIcon } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { ActivityItem, ActivityType } from "@/lib/mock/admin-dashboard.mock";

const ICONS: Record<ActivityType, { icon: LucideIcon; bg: string; color: string }> = {
  member: { icon: UserPlus, bg: "bg-[#FFE8ED] dark:bg-[#87102C]/25", color: "text-[#87102C] dark:text-[#FFB3C1]" },
  sermon: { icon: BookOpen, bg: "bg-violet-50 dark:bg-violet-500/15", color: "text-violet-600 dark:text-violet-400" },
  attendance: { icon: ClipboardCheck, bg: "bg-emerald-50 dark:bg-emerald-500/15", color: "text-emerald-600 dark:text-emerald-400" },
  prayer: { icon: HandHeart, bg: "bg-amber-50 dark:bg-amber-500/15", color: "text-amber-600 dark:text-amber-400" },
};

export default function RecentActivitiesCard({
  activities,
  ...chrome
}: { activities: ActivityItem[] } & DashboardCardChrome) {
  return (
    <DashboardCard kicker="Live" title="Recent Activities" icon={Activity} {...chrome}>
      {activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">No recent activity.</p>
      ) : (
        <ul className="space-y-1">
          {activities.map((a) => {
            const meta = ICONS[a.type];
            const Icon = meta.icon;
            return (
              <li key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                  <Icon size={15} className={meta.color} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-[#222] dark:text-white/80">{a.text}</p>
                  <p className="text-xs text-[#8a7e80] dark:text-white/40">{a.timeAgo}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
