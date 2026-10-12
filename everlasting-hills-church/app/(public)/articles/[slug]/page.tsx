import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";
import ArticleComments from "@/components/blog/ArticleComments";
import ReadingView from "@/components/medium/ReadingView";
import ShareMenu from "@/components/medium/ShareMenu";
import { MAvatar, MoreStories, StoryRow } from "@/components/medium/parts";
import { compact, fromBlog } from "@/components/medium/story";
import { serverApi, type ApiError } from "@/lib/api/server";
import type { BlogArticle, BlogArticleSummary, BlogPage } from "@/lib/api/blog";

export const dynamic = "force-dynamic";
const SITE = "https://www.everlastinghills.church";

async function load(slug: string): Promise<BlogArticle | null> {
  try {
    return await serverApi.get<BlogArticle>(
      `/public/articles/${encodeURIComponent(slug)}`,
      { withAuth: false, cache: "no-store" },
    );
  } catch (error) {
    if ((error as ApiError).status === 404) return null;
    throw error;
  }
}

/** Title, summary and cover for WhatsApp, Facebook, X and LinkedIn previews. */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const a = await load(params.slug).catch(() => null);
  if (!a) return { title: "Article — Everlasting Hills Church" };
  const description = a.subtitle?.trim() || a.excerpt || `By ${a.author.name}`;
  return {
    title: `${a.title} — Everlasting Hills Church`,
    description,
    alternates: { canonical: `${SITE}/articles/${a.slug}` },
    openGraph: {
      title: a.title,
      description,
      type: "article",
      url: `${SITE}/articles/${a.slug}`,
      siteName: "Everlasting Hills Church",
      authors: [a.author.name],
      publishedTime: a.publishedAt ?? undefined,
      images: a.coverImageUrl ? [{ url: a.coverImageUrl }] : undefined,
    },
    twitter: {
      card: a.coverImageUrl ? "summary_large_image" : "summary",
      title: a.title,
      description,
    },
  };
}

/** One story on the public blog: the Medium reading column, share, and responses. */
export default async function PublicArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const a = await load(params.slug);
  if (!a) notFound();

  let others: BlogArticleSummary[] = [];
  try {
    const list = await serverApi.get<BlogPage<BlogArticleSummary>>(
      "/public/articles?page=1",
      { withAuth: false, cache: "no-store" },
    );
    others = list.items.filter((s) => s.slug !== a.slug);
  } catch {
    others = [];
  }
  // Beside the story on wide screens; under it on phones, where there is no side.
  const side = others.slice(0, 6).map(fromBlog);
  const more = others.slice(0, 3);
  const url = `${SITE}/articles/${a.slug}`;

  return (
    <main className="medium min-h-screen pt-24">
      <div className="mx-auto max-w-[1100px] lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 lg:px-6">
        <div className="min-w-0">
          <ReadingView
            article={{
              title: a.title,
              subtitle: a.subtitle?.trim() || null,
              body: a.body,
              coverImageUrl: a.coverImageUrl,
              scriptureLabel: a.scriptureLabel,
              readingMinutes: a.readingMinutes,
              publishedAt: a.publishedAt,
              author: { name: a.author.name, photoUrl: a.author.photoUrl },
            }}
            back={
              <Link
                href="/articles"
                className="m-muted inline-flex min-h-11 items-center gap-1.5 text-sm hover:text-[var(--m-ink)]"
              >
                <ArrowLeft size={15} aria-hidden="true" /> All stories
              </Link>
            }
            actions={
              <>
                <div className="m-muted flex items-center gap-5 text-sm">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/dashboard/articles/${a.slug}`)}`}
                    className="m-icon-btn"
                    aria-label={`${a.likeCount} likes. Sign in to like`}
                  >
                    <Heart size={19} aria-hidden="true" />{" "}
                    {compact(a.likeCount)}
                  </Link>
                  <a
                    href="#comments"
                    className="m-icon-btn"
                    aria-label={`${a.commentCount} responses`}
                  >
                    <MessageCircle size={19} aria-hidden="true" />{" "}
                    {compact(a.commentCount)}
                  </a>
                </div>
                <ShareMenu url={url} title={a.title} />
              </>
            }
            footer={
              <>
                <div className="mt-12 flex items-center justify-end border-t m-rule pt-4">
                  <ShareMenu url={url} title={a.title} />
                </div>

                <section className="mt-10 flex items-start gap-4 border-b m-rule pb-10">
                  <MAvatar
                    name={a.author.name}
                    photoUrl={a.author.photoUrl}
                    size={64}
                  />
                  <div>
                    <p className="m-ink text-xl font-bold">
                      Written by {a.author.name}
                    </p>
                    <p className="m-muted mt-1 text-sm">
                      A member of the Everlasting Hills Church family, Ibadan.
                    </p>
                  </div>
                </section>

                <div className="mt-10">
                  <ArticleComments slug={a.slug} asMember={false} />
                </div>

                {more.length > 0 && (
                  <section className="mt-14 border-t m-rule pt-8 lg:hidden">
                    <h2 className="m-ink text-xl font-bold">
                      More from the family
                    </h2>
                    {more.map((s) => (
                      <StoryRow
                        key={s.id}
                        story={fromBlog(s)}
                        href={`/articles/${s.slug}`}
                      />
                    ))}
                    <Link href="/articles" className="m-pill-outline mt-8">
                      See all stories
                    </Link>
                  </section>
                )}

                <aside className="m-paper mt-14 border m-rule p-8">
                  <p className="m-display m-ink text-3xl">Worship with us</p>
                  <p className="m-muted mt-2 text-base">
                    Everlasting Hills Church is a family in Ibadan. You are
                    welcome any Sunday.
                  </p>
                  <Link href="/visit" className="m-pill mt-6">
                    Plan a visit
                  </Link>
                </aside>
              </>
            }
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-8 pb-16 pt-8">
            <MoreStories stories={side} basePath="/articles" />
            <Link href="/articles" className="m-pill-outline w-full">
              See all stories
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
