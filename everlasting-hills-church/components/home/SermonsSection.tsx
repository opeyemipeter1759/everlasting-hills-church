import ScrollReveal from "./ScrollReveal";
import { ArrowRight, BookOpen, Play } from "lucide-react";
import Link from "next/link";
import { SERMONS_FALLBACK, type SermonsContent } from "@/lib/site-settings";
import type { LatestSermon } from "@/types";

/**
 * Sermons section.
 *
 * Server component: fetches the latest N sermons (configurable via
 * site_settings.SERMONS.displayCount) from the public /sermons/latest endpoint.
 * Chrome (label, headline, subtext, "View all" CTA) also comes from site_settings.
 *
 * The previous YouTube-driven version stays useful for video discovery on the
 * /sermons page, but the homepage strip is now backed by admin-created sermons.
 * If the fetch fails or returns empty, we render the section header + a soft
 * "no sermons yet" placeholder instead of breaking.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:4000";

interface ServerEnvelope<T> {
  data: T;
}

async function fetchLatestSermons(limit: number): Promise<LatestSermon[]> {
  try {
    const res = await fetch(`${BASE_URL}/sermons/latest?limit=${limit}`, {
      next: { revalidate: 300, tags: ["sermons-latest"] },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as ServerEnvelope<LatestSermon[]>;
    return body?.data ?? [];
  } catch {
    return [];
  }
}

function formatSermonDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SermonsSection({
  content,
}: {
  content?: SermonsContent;
}) {
  const c = content ?? SERMONS_FALLBACK;
  const sermons = await fetchLatestSermons(c.displayCount);

  return (
    <section
      id="sermons"
      className="relative overflow-hidden py-24 md:py-32 bg-church-dark text-white"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 right-[-5%] h-72 w-72 rounded-full bg-church-maroon/18 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-8%] h-80 w-80 rounded-full bg-[#FFB3C1]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid-white opacity-60" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <ScrollReveal>
              <p className="text-[#FFB3C1] text-sm tracking-[0.25em] uppercase font-semibold mb-3">
                {c.label}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight text-balance">
                {c.headline}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="mt-4 text-white/55 text-base sm:text-lg leading-relaxed max-w-prose">
                {c.subtext}
              </p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2} direction="right">
            <Link
              href={c.viewAllCta.href}
              className="flex items-center gap-2 text-[#FFB3C1] text-sm font-semibold hover:gap-3 transition-all whitespace-nowrap"
            >
              {c.viewAllCta.label} <ArrowRight size={15} />
            </Link>
          </ScrollReveal>
        </div>

        {sermons.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sermons.map((sermon, i) => (
              <ScrollReveal key={sermon.id} delay={0.05 + i * 0.08}>
                <SermonCard sermon={sermon} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <EmptyState viewAllHref={c.viewAllCta.href} viewAllLabel={c.viewAllCta.label} />
        )}
      </div>
    </section>
  );
}

/* ── Sermon card (server) ───────────────────────────────────────────────── */

function SermonCard({ sermon }: { sermon: LatestSermon }) {
  const dateLabel = formatSermonDate(sermon.publishedAt || sermon.date);

  return (
    <Link
      href={`/sermons/${sermon.slug}`}
      className="group block overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-white/18 hover:shadow-[0_30px_80px_rgba(0,0,0,0.4)] hover:-translate-y-1"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#14070b]">
        {sermon.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={sermon.thumbnailUrl}
            alt={sermon.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#271015] via-[#14070b] to-[#0a0a0a]">
            <div className="rounded-full border border-white/10 bg-white/5 p-5">
              <Play className="h-8 w-8 text-[#FFB3C1]" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/25 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start gap-2 p-4">
          {sermon.isFeatured && (
            <span className="inline-flex items-center rounded-full bg-[#87102C] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              Featured
            </span>
          )}
          {sermon.series && (
            <span className="inline-flex items-center rounded-full bg-white/10 border border-white/15 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-white/80">
              {sermon.series}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-3">
        <p className="text-[#FFB3C1]/80 text-xs tracking-[0.18em] uppercase font-semibold">
          {sermon.speaker} · {dateLabel}
        </p>
        <h3 className="text-white text-lg font-bold leading-snug tracking-tight line-clamp-2">
          {sermon.title}
        </h3>
        {sermon.description && (
          <p className="text-white/55 text-sm leading-relaxed line-clamp-2">
            {sermon.description}
          </p>
        )}
        <p className="inline-flex items-center gap-1.5 text-[#FFB3C1] text-xs font-semibold group-hover:gap-2.5 transition-all">
          Listen
          <ArrowRight size={13} />
        </p>
      </div>
    </Link>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState({ viewAllHref, viewAllLabel }: { viewAllHref: string; viewAllLabel: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl">
      <div className="mx-auto w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5">
        <BookOpen size={22} className="text-[#FFB3C1]" />
      </div>
      <p className="text-white font-semibold text-base mb-1">No sermons published yet</p>
      <p className="text-white/55 text-sm max-w-md mx-auto">
        Recent messages will appear here once they are added in the admin dashboard.
      </p>
      <Link
        href={viewAllHref}
        className="mt-6 inline-flex items-center gap-2 text-[#FFB3C1] text-sm font-semibold hover:gap-3 transition-all"
      >
        {viewAllLabel} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
