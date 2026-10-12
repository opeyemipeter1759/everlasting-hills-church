import Link from "next/link";
import { BookOpen, MessageCircle } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import { serverApi } from "@/lib/api/server";
import type { BlogArticleSummary, BlogPage } from "@/lib/api/blog";

export const metadata = {
  title: "Articles — Everlasting Hills Church",
  description: "What members of Everlasting Hills Church are learning from God's Word: articles, reflections and testimonies.",
  openGraph: {
    title: "Articles from Everlasting Hills Church",
    description: "What our members are learning from God's Word.",
    type: "website",
  },
};
export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }) : "";

function Card({ a }: { a: BlogArticleSummary }) {
  return (
    <Link
      href={`/articles/${a.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-brand-rose/60 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(135,16,44,0.1)]"
    >
      <div className="relative aspect-[16/9] bg-[#2a0410]">
        {a.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <BookOpen className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/20" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {a.scriptureLabel && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#87102C]">{a.scriptureLabel}</p>}
        <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-[#111] group-hover:text-[#87102C]">{a.title}</h3>
        {a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-[#4a4a4a]">{a.excerpt}</p>}
        <p className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-[#8a7e80]">
          <span>
            {a.author.name} · {a.readingMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={12} aria-hidden="true" /> {a.commentCount}
          </span>
        </p>
      </div>
    </Link>
  );
}

/** The public blog: published member articles, for anyone. */
export default async function ArticlesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  let data: BlogPage<BlogArticleSummary> = { items: [], total: 0, page, pageSize: 12 };
  try {
    data = await serverApi.get<BlogPage<BlogArticleSummary>>(`/public/articles?page=${page}`, { withAuth: false, cache: "no-store" });
  } catch {
    // The page still renders; the list is just empty.
  }
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const lead = page === 1 ? data.items[0] : undefined;
  const rest = lead ? data.items.slice(1) : data.items;

  return (
    <main>
      <PageHero
        eyebrow="Articles"
        title="Words from"
        accent="the family"
        lead="What our members are learning from God's Word: reflections, teaching and testimonies, written by the church."
      />

      <section className="mx-auto max-w-[1100px] px-4 py-12 xs:px-5 sm:px-8 sm:py-16">
        {data.items.length === 0 ? (
          <p className="text-center text-[#5A4A4D]">No articles yet. Check back soon.</p>
        ) : (
          <>
            {lead && (
              <Link
                href={`/articles/${lead.slug}`}
                className="group mb-10 grid overflow-hidden rounded-3xl border border-brand-rose/60 bg-white shadow-[0_1px_20px_rgba(135,16,44,0.06)] md:grid-cols-2"
              >
                <div className="relative min-h-[220px] bg-[#2a0410]">
                  {lead.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lead.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <BookOpen className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/20" aria-hidden="true" />
                  )}
                </div>
                <div className="p-6 sm:p-10">
                  {lead.scriptureLabel && <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87102C]">{lead.scriptureLabel}</p>}
                  <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#111] group-hover:text-[#87102C]">{lead.title}</h2>
                  {lead.excerpt && <p className="mt-3 line-clamp-4 text-[#4a4a4a]">{lead.excerpt}</p>}
                  <p className="mt-5 text-sm text-[#8a7e80]">
                    {lead.author.name} · {fmt(lead.publishedAt)} · {lead.readingMinutes} min read
                  </p>
                </div>
              </Link>
            )}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <li key={a.id}>
                  <Card a={a} />
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <nav aria-label="Article pages" className="mt-10 flex items-center justify-center gap-3 text-sm font-semibold">
                {page > 1 && (
                  <Link href={`/articles?page=${page - 1}`} className="rounded-full border border-brand-rose px-5 py-2.5 text-[#87102C] hover:bg-brand-blush">
                    Newer
                  </Link>
                )}
                <span className="text-[#8a7e80]">
                  Page {page} of {pages}
                </span>
                {page < pages && (
                  <Link href={`/articles?page=${page + 1}`} className="rounded-full border border-brand-rose px-5 py-2.5 text-[#87102C] hover:bg-brand-blush">
                    Older
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
