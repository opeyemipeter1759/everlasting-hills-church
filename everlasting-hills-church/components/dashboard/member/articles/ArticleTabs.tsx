"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Newspaper, PenLine, PencilLine } from "lucide-react";
import { useArticleReviewAccess } from "@/lib/api/articles";

/**
 * Reading and writing, side by side.
 *
 * The write button is not a tab: it is the point of the section, so it keeps a
 * filled treatment and sits apart from the two things you can browse.
 */
const TABS = [
  { href: "/dashboard/articles", label: "The church", icon: Newspaper },
  { href: "/dashboard/articles/mine", label: "My writing", icon: PenLine },
];

export default function ArticleTabs() {
  const pathname = usePathname();
  const { data: access } = useArticleReviewAccess();
  const tabs = access?.canReview
    ? [...TABS, { href: "/dashboard/articles/review", label: `Review${access.pending ? ` (${access.pending})` : ""}`, icon: ClipboardCheck }]
    : TABS;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex max-w-full flex-wrap gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/dashboard/articles"
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
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

      <Link
        href="/dashboard/articles/write"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#87102C]/25 bg-white px-3.5 py-1.5 text-xs font-bold text-[#87102C] transition-colors hover:bg-[#FFF4F6] dark:border-[#FFB3C1]/25 dark:bg-white/[0.04] dark:text-[#FFB3C1] dark:hover:bg-white/[0.08]"
      >
        <PencilLine size={13} /> Write
      </Link>
    </div>
  );
}
