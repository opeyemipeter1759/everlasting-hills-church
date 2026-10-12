import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import RichText from "@/components/ui/display/RichText";
import ShareArticle from "@/components/blog/ShareArticle";
import ArticleComments from "@/components/blog/ArticleComments";
import { serverApi, type ApiError } from "@/lib/api/server";
import type { BlogArticle } from "@/lib/api/blog";

export const dynamic = "force-dynamic";

async function load(slug: string): Promise<BlogArticle | null> {
  try {
    return await serverApi.get<BlogArticle>(`/public/articles/${encodeURIComponent(slug)}`, { withAuth: false, cache: "no-store" });
  } catch (error) {
    if ((error as ApiError).status === 404) return null;
    throw error;
  }
}

/** Title, summary and cover for WhatsApp, Facebook and X previews. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await load(params.slug).catch(() => null);
  if (!a) return { title: "Article — Everlasting Hills Church" };
  const description = a.excerpt ?? `By ${a.author.name}`;
  return {
    title: `${a.title} — Everlasting Hills Church`,
    description,
    openGraph: {
      title: a.title,
      description,
      type: "article",
      url: `https://www.everlastinghills.church/articles/${a.slug}`,
      authors: [a.author.name],
      publishedTime: a.publishedAt ?? undefined,
      images: a.coverImageUrl ? [{ url: a.coverImageUrl }] : undefined,
    },
    twitter: { card: a.coverImageUrl ? "summary_large_image" : "summary", title: a.title, description },
  };
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }) : "";

/** One article on the public blog: read, share, and comment. */
export default async function PublicArticlePage({ params }: { params: { slug: string } }) {
  const a = await load(params.slug);
  if (!a) notFound();
  const initials = a.author.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="pt-24">
      <article className="mx-auto max-w-2xl px-4 py-10 xs:px-5 sm:px-8">
        <Link href="/articles" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#87102C] hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> All articles
        </Link>
        {a.scriptureLabel && <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#87102C]">{a.scriptureLabel}</p>}
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.15] tracking-tight text-[#111] sm:text-[2.6rem]">{a.title}</h1>

        <div className="mt-6 flex items-center gap-3 border-y border-gray-100 py-4">
          {a.author.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.author.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#87102C] text-sm font-bold text-white">{initials}</span>
          )}
          <div>
            <p className="text-sm font-bold text-[#111]">{a.author.name}</p>
            <p className="text-xs text-[#8a7e80]">
              {fmt(a.publishedAt)} · {a.readingMinutes} min read · Everlasting Hills Church
            </p>
          </div>
        </div>

        {a.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.coverImageUrl} alt="" className="mt-6 aspect-[2/1] w-full rounded-2xl object-cover" />
        )}

        <div className="mt-8">
          <RichText text={a.body} density="comfortable" className="text-[17px] leading-[1.75] text-gray-800" emphasisClassName="text-[#111]" />
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6">
          <ShareArticle slug={a.slug} title={a.title} />
        </div>

        <div className="mt-12">
          <ArticleComments slug={a.slug} asMember={false} />
        </div>

        <aside className="mt-12 rounded-3xl bg-church-dark p-6 text-center text-white sm:p-8">
          <p className="font-serif text-xl font-bold">Worship with us</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">Everlasting Hills Church is a family in Ibadan. You are welcome any Sunday.</p>
          <Link href="/visit" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#87102C] px-6 text-sm font-semibold hover:bg-[#6E0C24]">
            Plan a visit
          </Link>
        </aside>
      </article>
    </main>
  );
}
