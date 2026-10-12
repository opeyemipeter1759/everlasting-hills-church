import Link from "next/link";
import { serverApi } from "@/lib/api/server";
import type { BlogArticleSummary, BlogPage } from "@/lib/api/blog";
import { StaffPicks, StoryRow, WriteCard } from "@/components/medium/parts";
import { fromBlog } from "@/components/medium/story";

export const metadata = {
  title: "Articles — Everlasting Hills Church",
  description: "What members of Everlasting Hills Church are learning from God's Word: stories, reflections and testimonies.",
  openGraph: {
    title: "Stories & ideas from the Everlasting Hills family",
    description: "What our members are learning from God's Word.",
    type: "website",
  },
};
export const dynamic = "force-dynamic";

/**
 * The public blog, laid out like Medium: a cream reading room, a serif
 * headline, then the stories down the left and the pastors' picks on the
 * right. Anyone can read; writing goes through the app.
 */
export default async function ArticlesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  let data: BlogPage<BlogArticleSummary> = { items: [], total: 0, page, pageSize: 12 };
  let failed = false;
  try {
    data = await serverApi.get<BlogPage<BlogArticleSummary>>(`/public/articles?page=${page}`, { withAuth: false, cache: "no-store" });
  } catch {
    failed = true;
  }
  const stories = data.items.map(fromBlog);
  const picks = stories.filter((s) => s.featured);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <main className="medium min-h-screen pt-24">
      {page === 1 && (
        <section className="border-b m-rule">
          <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-12 xs:px-6 sm:pb-24 sm:pt-20">
            <h1 className="m-display m-ink text-[56px] leading-[0.9] sm:text-[96px] lg:text-[120px] lg:leading-[0.83]">
              Stories
              <br />
              &amp; ideas
            </h1>
            <p className="m-muted mt-8 max-w-xl text-xl">What the Everlasting Hills family is learning from God&apos;s Word, written by the church.</p>
            <a href="#stories" className="m-pill mt-10 px-6">
              Start reading
            </a>
          </div>
        </section>
      )}

      <div id="stories" className="mx-auto grid max-w-[1200px] scroll-mt-24 gap-12 px-4 py-10 xs:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20">
        <div className="min-w-0">
          {failed ? (
            <p className="m-muted py-10">The stories could not load just now. Please refresh the page.</p>
          ) : stories.length === 0 ? (
            <p className="m-muted py-10">No stories yet. Check back soon.</p>
          ) : (
            stories.map((s) => <StoryRow key={s.id} story={s} href={`/articles/${s.slug}`} />)
          )}

          {pages > 1 && (
            <nav aria-label="Story pages" className="mt-10 flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link href={`/articles?page=${page - 1}#stories`} className="m-pill-outline">
                  Newer stories
                </Link>
              ) : (
                <span />
              )}
              <span className="m-muted text-sm">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link href={`/articles?page=${page + 1}#stories`} className="m-pill">
                  Older stories
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>

        <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
          <StaffPicks stories={picks} basePath="/articles" />
          <WriteCard href="/dashboard/articles/write" signedIn={false} />
        </aside>
      </div>
    </main>
  );
}
