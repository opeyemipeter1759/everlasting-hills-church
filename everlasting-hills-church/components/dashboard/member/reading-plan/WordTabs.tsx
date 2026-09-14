"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Library } from "lucide-react";

/**
 * Tabs within Bible reading. Sermons is a separate destination with its own nav
 * entry: listening to preaching and keeping a daily reading are different
 * habits, and pairing them made the reading plan look like a sub feature of the
 * sermon library.
 */
const TABS = [
  { href: "/dashboard/reading", label: "Today", icon: BookOpen },
  { href: "/dashboard/reading/schedule", label: "Whole plan", icon: CalendarDays },
  { href: "/dashboard/reading/plans", label: "Plans", icon: Library },
];

export default function WordTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Bible plan navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-gray-950 sm:static sm:inline-flex sm:w-auto sm:rounded-full sm:border sm:bg-gray-50 sm:p-1 sm:shadow-none sm:dark:bg-white/[0.04]">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        // The reading plan chooser lives under /dashboard/reading, so a prefix
        // match keeps the tab lit while a member is picking a plan.
        // Exact match for the reading tabs, since /dashboard/reading is a
        // prefix of both the schedule and the chooser and would otherwise stay
        // lit on all three.
        const active =
          tab.href === "/dashboard/reading"
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors sm:min-h-11 sm:flex-auto sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3.5 sm:text-xs ${
              active
                ? "bg-[#87102C] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:text-white/45 dark:hover:text-white"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
