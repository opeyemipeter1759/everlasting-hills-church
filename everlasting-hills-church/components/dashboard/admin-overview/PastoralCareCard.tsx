import Link from "next/link";
import {
  ChevronRight,
  HandHeart,
  Heart,
  MessageCircleQuestion,
  MessageSquareQuote,
  type LucideIcon,
} from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AdminDashboardData } from "@/lib/types/admin-dashboard";

type Care = AdminDashboardData["pastoralCare"];

function CountRow({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex w-full items-center justify-between gap-3 rounded-xl bg-[#FFF4F6]/50 px-4 py-3 transition-colors hover:bg-[#FFE8ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon size={15} className={iconColor} aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-medium text-[#444] dark:text-white/70">{label}</span>
        </span>
        <span className="flex flex-shrink-0 items-center gap-1">
          <span className="font-display text-lg font-bold tabular-nums text-[#111] dark:text-white">
            {value}
          </span>
          <ChevronRight
            size={15}
            className="text-[#b8a8ac] transition-transform group-hover:translate-x-0.5 dark:text-white/30"
            aria-hidden="true"
          />
        </span>
      </Link>
    </li>
  );
}

/** The three pastoral inboxes that need an administrator's attention. */
export default function PastoralCareCard({
  care,
  ...chrome
}: { care: Care } & DashboardCardChrome) {
  const allClear = care.questions === 0 && care.testimonies === 0 && care.prayerRequests === 0;

  return (
    <DashboardCard kicker="Shepherding" title="Pastoral Care" icon={HandHeart} {...chrome}>
      {allClear ? (
        <div className="flex flex-col items-center gap-1.5 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
            <HandHeart size={18} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-[#111] dark:text-white">Nothing waiting for review</p>
          <p className="max-w-xs text-xs text-[#8a7e80] dark:text-white/40">
            Questions are answered, testimonies are reviewed, and prayer requests are prayed over.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          <CountRow
            icon={MessageCircleQuestion}
            label="Questions waiting for an answer"
            value={care.questions}
            iconBg="bg-amber-50 dark:bg-amber-500/15"
            iconColor="text-amber-600 dark:text-amber-400"
            href="/dashboard/questions"
          />
          <CountRow
            icon={MessageSquareQuote}
            label="Testimonies to review"
            value={care.testimonies}
            iconBg="bg-sky-50 dark:bg-sky-500/15"
            iconColor="text-sky-600 dark:text-sky-400"
            href="/dashboard/testimonies"
          />
          <CountRow
            icon={Heart}
            label="Prayer requests to pray over"
            value={care.prayerRequests}
            iconBg="bg-[#FFE8ED] dark:bg-[#87102C]/25"
            iconColor="text-[#87102C] dark:text-[#FFB3C1]"
            href="/dashboard/prayer-requests"
          />
        </ul>
      )}
    </DashboardCard>
  );
}
