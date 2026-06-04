import { Cake, Gift } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AdminDashboardData } from "@/lib/mock/admin-dashboard.mock";

export default function BirthdayAnniversaryCard({
  celebrations,
  ...chrome
}: { celebrations: AdminDashboardData["celebrations"] } & DashboardCardChrome) {
  return (
    <DashboardCard kicker="Pastoral Care" title="Birthdays & Anniversaries" icon={Cake} {...chrome}>
      <div className="grid grid-cols-2 gap-3">
        <Celebration
          icon={Cake}
          value={celebrations.birthdaysToday}
          label={celebrations.birthdaysToday === 1 ? "Birthday Today" : "Birthdays Today"}
          tint="from-rose-500/10 to-rose-500/0 text-rose-600 dark:text-rose-400"
        />
        <Celebration
          icon={Gift}
          value={celebrations.anniversaries}
          label={celebrations.anniversaries === 1 ? "Anniversary" : "Anniversaries"}
          tint="from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400"
        />
      </div>
    </DashboardCard>
  );
}

function Celebration({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: typeof Cake;
  value: number;
  label: string;
  tint: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-[#E7CDD3]/50 bg-gradient-to-b py-5 text-center dark:border-white/[0.07] ${tint}`}
    >
      <Icon size={20} aria-hidden="true" />
      <span className="font-display text-2xl font-bold tabular-nums text-[#111] dark:text-white">
        {value}
      </span>
      <span className="text-[11px] font-medium text-[#8a7e80] dark:text-white/50">{label}</span>
    </div>
  );
}
