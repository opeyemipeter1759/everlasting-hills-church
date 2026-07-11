import type { ReactNode } from "react";
import { CheckCircle2, Sparkles, UserCheck, Users } from "lucide-react";
import type { EventRsvp } from "@/types";

function StatCard({
  icon,
  label,
  value,
  tone = "burgundy",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: "burgundy" | "emerald" | "amber" | "sky";
}) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : tone === "amber"
        ? "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : tone === "sky"
          ? "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400"
          : "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a]";
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-4">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${toneCls}`}>{icon}</span>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

export default function EventRsvpsStats({ rsvps }: { rsvps: EventRsvp[] }) {
  const totalAttendees = rsvps.reduce((sum, r) => sum + (r.attendees || 0), 0);
  const memberCount = rsvps.filter((r) => r.isMember).length;
  const newCount = rsvps.length - memberCount;
  const checkedInCount = rsvps.filter((r) => r.checkedIn).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard icon={<Users size={16} />} label="Submissions" value={rsvps.length} />
      <StatCard icon={<Users size={16} />} label="Attendees" value={totalAttendees} />
      <StatCard icon={<UserCheck size={16} />} label="Present" value={checkedInCount} tone="sky" />
      <StatCard icon={<CheckCircle2 size={16} />} label="Members" value={memberCount} tone="emerald" />
      <StatCard icon={<Sparkles size={16} />} label="New people" value={newCount} tone="amber" />
    </div>
  );
}
