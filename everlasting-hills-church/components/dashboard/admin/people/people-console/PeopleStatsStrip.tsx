import type { ReactNode } from "react";
import { Activity, CalendarPlus, Network, ShieldCheck, Users } from "lucide-react";
import type { DirectoryMeta } from "@/lib/api/people";

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a] mb-3">
        {icon}
      </span>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

export default function PeopleStatsStrip({
  counts,
  leaders,
}: {
  counts?: DirectoryMeta["counts"];
  leaders: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard icon={<Users size={16} />} label="Total" value={counts?.total} />
      <StatCard icon={<Activity size={16} />} label="Active" value={counts?.active} />
      <StatCard icon={<ShieldCheck size={16} />} label="Leaders" value={leaders} />
      <StatCard icon={<Network size={16} />} label="On a team" value={counts?.withUnit} />
      <StatCard icon={<CalendarPlus size={16} />} label="New this month" value={counts?.thisMonth} />
    </div>
  );
}
