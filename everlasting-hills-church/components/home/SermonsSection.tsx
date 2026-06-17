import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERMONS_FALLBACK, type SermonsContent } from "@/lib/site-settings";
import RecentSermonsGrid, { type RecentSermon } from "./RecentSermonsGrid";

/**
 * "Recent Sermons" — dark stacked section.
 *
 * Server component: fetches the recent strip from NestJS (GET /sermons/recent) with
 * ISR, so Nest owns the data + sort and Next owns render + cache. The grid (motion)
 * is a client component; the cards are CSS-only group-hover Links.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:4000";

interface ServerEnvelope<T> {
  data: T;
}

async function fetchRecentSermons(limit: number): Promise<RecentSermon[]> {
  try {
    const res = await fetch(`${BASE_URL}/sermons/recent?limit=${limit}`, {
      next: { revalidate: 300, tags: ["sermons-recent"] },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as ServerEnvelope<RecentSermon[]>;
    return body?.data ?? [];
  } catch {
    return [];
  }
}

export default async function SermonsSection({ content }: { content?: SermonsContent }) {
  const c = content ?? SERMONS_FALLBACK;
  const sermons = await fetchRecentSermons(c.displayCount || 3);
  // Our writing style uses no em dashes.
  const lead = (c.subtext ?? "").replace(/\s*—\s*/g, ", ");

  return (
    <section id="sermons" className="relative overflow-hidden bg-[#080808] py-24 md:py-32 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-[-5%] h-72 w-72 rounded-full bg-[#87102C]/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-8%] h-80 w-80 rounded-full bg-[#FFB3C1]/8 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#FFB3C1]">
              {c.label}
            </p>
            <h2 className="font-serif text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-4xl md:text-5xl">
              {c.headline}
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-white/55 sm:text-lg">
              {lead}
            </p>
          </div>
          <Link
            href={c.viewAllCta.href}
            className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#FFB3C1] transition-all hover:gap-3"
          >
            {c.viewAllCta.label}
            <ArrowRight size={15} />
          </Link>
        </div>

        {sermons.length > 0 ? (
          <RecentSermonsGrid sermons={sermons} />
        ) : (
          <EmptyState viewAllHref={c.viewAllCta.href} viewAllLabel={c.viewAllCta.label} />
        )}
      </div>
    </section>
  );
}

function EmptyState({ viewAllHref, viewAllLabel }: { viewAllHref: string; viewAllLabel: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl">
      <svg
        viewBox="0 0 120 64"
        className="mx-auto mb-6 h-14 w-28 text-[#FFB3C1]/70"
        fill="none"
        aria-hidden="true"
      >
        <path d="M2 62 L40 18 L60 40 L78 10 L118 62 Z" fill="currentColor" opacity="0.15" />
        <path d="M2 62 L40 18 L60 40 L78 10 L118 62 Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <p className="text-white/70">Recent messages will appear here soon.</p>
      <Link
        href={viewAllHref}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#FFB3C1] transition-all hover:gap-3"
      >
        {viewAllLabel}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
