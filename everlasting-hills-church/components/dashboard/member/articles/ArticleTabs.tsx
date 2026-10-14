"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, SquarePen } from "lucide-react";
import { useArticleReviewAccess } from "@/lib/api/articles";

/**
 * The reading room's frame inside the app: the cream canvas edge to edge
 * (pulling back the dashboard's padding), and a quiet top bar with the
 * section links and a Write button, as Medium has.
 */
export function MediumPage({ children }: { children: ReactNode }) {
  return <div className="medium -m-4 min-h-[calc(100dvh-3.5rem)] px-4 pb-28 pt-4 sm:-m-6 sm:px-8 md:pb-12">{children}</div>;
}

const LINKS = [
  { href: "/dashboard/articles", label: "Stories" },
  { href: "/dashboard/articles/mine", label: "Your stories" },
];

export default function ArticleTabs() {
  const pathname = usePathname();
  const { data: access } = useArticleReviewAccess();
  const links = access?.canReview ? [...LINKS, { href: "/dashboard/articles/review", label: "Review" }] : LINKS;

  return (
    <nav aria-label="Articles" className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 border-b m-rule pb-3">
      <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
        {links.map((l) => {
          const active = l.href === "/dashboard/articles" ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-sm ${active ? "m-ink" : "m-muted hover:text-[var(--m-ink)]"}`}
            >
              {l.href.endsWith("/review") && <ClipboardCheck size={15} aria-hidden="true" />}
              {l.label}
              {l.href.endsWith("/review") && !!access?.pending && (
                <span className="m-pill !min-h-0 !px-2 !py-0 text-[11px]" aria-label={`${access.pending} waiting`}>
                  {access.pending}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <Link href="/dashboard/articles/write" className="m-muted inline-flex min-h-11 items-center gap-2 text-sm hover:text-[var(--m-ink)]">
        <SquarePen size={20} aria-hidden="true" /> Write
      </Link>
    </nav>
  );
}
