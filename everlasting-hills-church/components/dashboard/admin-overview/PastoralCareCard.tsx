import { HandHeart, HeartHandshake, Stethoscope, type LucideIcon } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AdminDashboardData } from "@/lib/mock/admin-dashboard.mock";

export default function PastoralCareCard({
  care,
  ...chrome
}: { care: AdminDashboardData["pastoralCare"] } & DashboardCardChrome) {
  const rows: { icon: LucideIcon; label: string; value: number; iconBg: string; iconColor: string }[] = [
    { icon: HandHeart, label: "Prayer Requests", value: care.prayerRequests, iconBg: "bg-[#FFE8ED] dark:bg-[#87102C]/25", iconColor: "text-[#87102C] dark:text-[#FFB3C1]" },
    { icon: HeartHandshake, label: "Counseling", value: care.counseling, iconBg: "bg-violet-50 dark:bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400" },
    { icon: Stethoscope, label: "Hospital Visits", value: care.hospitalVisits, iconBg: "bg-sky-50 dark:bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400" },
  ];

  return (
    <DashboardCard kicker="Shepherding" title="Pastoral Care" icon={HandHeart} {...chrome}>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between rounded-xl bg-[#FFF4F6]/50 px-4 py-3 dark:bg-white/[0.03]"
          >
            <span className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${r.iconBg}`}>
                <r.icon size={15} className={r.iconColor} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-[#444] dark:text-white/70">{r.label}</span>
            </span>
            <span className="font-display text-lg font-bold tabular-nums text-[#111] dark:text-white">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
