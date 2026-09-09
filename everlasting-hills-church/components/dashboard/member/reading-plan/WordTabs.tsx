"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Headphones } from "lucide-react";

/**
 * One section, two ways in: the preaching you listen to and the scripture you
 * read. Reading sits beside sermons rather than in a module of its own, because
 * that is where a member already goes for the Word.
 */
const TABS = [
  { href: "/dashboard/sermon", label: "Sermons", icon: Headphones },
  { href: "/dashboard/reading", label: "Daily Reading", icon: BookOpen },
];

export default function WordTabs() {
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        // The reading plan chooser lives under /dashboard/reading, so a prefix
        // match keeps the tab lit while a member is picking a plan.
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
