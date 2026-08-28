import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  ClipboardList,
  DollarSign,
  Network,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata = { title: "Analytics — Dashboard" };

/**
 * Index for the analytics section.
 *
 * This route was a placeholder that rendered the word "page", and the admin
 * dashboard links straight to it from its "Analytics — church growth insights"
 * tile, so that tile led nowhere. The sub-pages were only reachable from the
 * sidebar.
 *
 * Access is not gated here: each destination enforces its own role, and listing
 * a page an admin cannot open is better than a dead tile. Roles are shown so it
 * is clear why a link might refuse.
 */
interface Surface {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  access?: string;
}

const SURFACES: Surface[] = [
  {
    href: "/dashboard/analytics/attendance",
    label: "Attendance",
    description: "Rates, trends and service comparisons drawn from member check-ins.",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/analytics/growth",
    label: "Monthly review",
    description: "New members, team integration and visitors, month by month.",
    icon: TrendingUp,
  },
  {
    href: "/dashboard/analytics/first-timers",
    label: "First timers",
    description: "Where newcomers come from, and how many return.",
    icon: UserPlus,
  },
  {
    href: "/dashboard/analytics/departments",
    label: "Departments",
    description: "Unit rosters, engagement and attendance by team.",
    icon: Network,
    access: "Unit leads and above",
  },
  {
    href: "/dashboard/analytics/engagement",
    label: "Engagement",
    description: "Who is drifting, who is consistent, and who needs a call.",
    icon: Activity,
    access: "Pastor and above",
  },
  {
    href: "/dashboard/analytics/giving",
    label: "Giving",
    description: "Contribution trends, categories and top donors.",
    icon: DollarSign,
    access: "Pastor and above",
  },
];

export default function AnalyticsIndexPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/20">
          <BarChart3 size={18} className="text-[#87102C] dark:text-[#e8768a]" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            Everything the church measures, in one place. Attendance figures come from usher
            headcounts and member check-ins; giving and engagement come from their own records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          return (
            <Link
              key={surface.href}
              href={surface.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-[#87102C]/30 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors group-hover:bg-[#87102C]/10 group-hover:text-[#87102C] dark:bg-white/[0.06] dark:text-white/50 dark:group-hover:text-[#e8768a]">
                  <Icon size={16} />
                </span>
                <ArrowRight
                  size={15}
                  className="mt-1 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#87102C] dark:text-white/20 dark:group-hover:text-[#e8768a]"
                />
              </div>

              <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{surface.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/45">
                {surface.description}
              </p>
              {surface.access && (
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">
                  {surface.access}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
