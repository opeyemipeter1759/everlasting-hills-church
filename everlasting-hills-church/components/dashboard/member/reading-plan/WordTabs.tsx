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
    <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
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
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              active
                ? "bg-[#87102C] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:text-white/45 dark:hover:text-white"
            }`}
          >
            <Icon size={13} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
