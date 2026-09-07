"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/dashboard/usher", label: "Record", icon: ClipboardList },
  { href: "/dashboard/usher/backlog", label: "Missing counts", icon: ListChecks },
  { href: "/dashboard/usher/history", label: "History", icon: History },
];

/**
 * Sub-navigation for the ushering module.
 *
 * The three screens are one job seen from three angles — what still needs
 * counting, what is being counted now, and what was counted before — so they
 * share a header rather than sitting apart in the sidebar. The count of
 * outstanding services rides on the middle tab, because that is the number an
 * usher opens the app to check.
 */
export default function UsherTabs({ pendingCount }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.03]"
      aria-label="Ushering"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        // Exact match for the index, prefix for the rest, so /history does not
        // light up the Record tab as well.
        const active = tab.href === "/dashboard/usher" ? pathname === tab.href : pathname.startsWith(tab.href);
        const showBadge = tab.href.endsWith("/backlog") && !!pendingCount;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              active
                ? "bg-white text-[#87102C] shadow-sm dark:bg-white/10 dark:text-[#e8768a]"
                : "text-gray-500 hover:text-gray-800 dark:text-white/45 dark:hover:text-white"
            }`}
          >
            <Icon size={14} />
            {tab.label}
            {showBadge && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
