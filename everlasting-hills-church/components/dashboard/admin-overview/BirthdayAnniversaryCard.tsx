import Image from "next/image";
import { Cake, Gift } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AdminDashboardData } from "@/lib/types/admin-dashboard";

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function dayBadge(daysUntil: number) {
  if (daysUntil === 0) return "Today 🎂";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil}d`;
}

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

      <div className="mt-4 space-y-1.5">
        {celebrations.upcomingBirthdays.length === 0 ? (
          <p className="py-3 text-center text-xs text-[#8a7e80] dark:text-white/45">
            No birthdays in the next 7 days.
          </p>
        ) : (
          celebrations.upcomingBirthdays.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2.5 rounded-xl border border-[#E7CDD3]/40 dark:border-white/[0.06] px-3 py-2"
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25">
                {m.photoUrl ? (
                  <Image src={m.photoUrl} alt="" fill sizes="32px" className="object-cover" />
                ) : (
                  <span className="text-[11px] font-bold text-[#87102C] dark:text-[#FFB3C1]">
                    {initials(m.firstName, m.lastName)}
                  </span>
                )}
              </div>
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[#111] dark:text-white">
                {m.firstName} {m.lastName}
              </p>
              <span className="shrink-0 text-[11px] font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                {dayBadge(m.daysUntil)}
              </span>
            </div>
          ))
        )}
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
