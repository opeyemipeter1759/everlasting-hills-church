"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { MTabs, StaffPicks, StoryRow, WriteCard } from "@/components/medium/parts";
import { fromCard } from "@/components/medium/story";
import { Pagination } from "@/components/dashboard/member/family/Pagination";
import { useArticleFeed, useSetArticleBookmark, useSetArticleLike, type FeedTab } from "@/lib/api/articles";
import ArticleTabs, { MediumPage } from "./ArticleTabs";

const TABS: { value: FeedTab; label: string }[] = [
  { value: "for-you", label: "For you" },
  { value: "featured", label: "Featured" },
  { value: "saved", label: "Saved" },
];

const EMPTY: Record<FeedTab, string> = {
  "for-you": "No stories yet. Be the first to write one.",
  featured: "Nothing featured yet. Pastors feature stories from the reader.",
  saved: "Nothing saved yet. Tap the bookmark on a story to read it later.",
};

/**
 * The church's stories in the app, laid out like Medium's home: tabs and a
 * search over a single reading column, the pastors' picks and a writing
 * invitation down the side. Like and save happen in place.
 */
export default function ArticleFeed() {
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(query);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const { data, isLoading, isError, refetch } = useArticleFeed(page, undefined, { tab, q });
  const { data: featured } = useArticleFeed(1, undefined, { tab: "featured", limit: 5 });
  const like = useSetArticleLike();
  const save = useSetArticleBookmark();

  const stories = (data?.articles ?? []).map(fromCard);
  const pages = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.limit)) : 1;
  const busy = like.isPending || save.isPending;

  return (
    <MediumPage>
      <ArticleTabs />
      <div className="mx-auto grid max-w-[1200px] gap-12 pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20">
        <div className="min-w-0">
          <label className="relative mb-6 block sm:hidden">
            <span className="sr-only">Search stories</span>
            <Search size={17} aria-hidden="true" className="m-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="m-paper m-ink w-full rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-1 focus:ring-[var(--m-ink)]" />
          </label>

          <MTabs
            tabs={TABS}
            value={tab}
            onChange={(t) => {
              setTab(t);
              setPage(1);
            }}
            label="Which stories"
          />

          {q.trim() && (
            <p className="m-muted mt-6 text-sm">
              Results for <span className="m-ink">“{q.trim()}”</span>
            </p>
          )}

          {isLoading ? (
            <div className="mt-6 space-y-8" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-3">
                  <div className="m-paper h-4 w-40 animate-pulse" />
                  <div className="m-paper h-6 w-3/4 animate-pulse" />
                  <div className="m-paper h-4 w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p role="alert" className="m-muted py-10">
              Stories could not load.{" "}
              <button type="button" onClick={() => refetch()} className="m-ink min-h-11 underline">
                Try again
              </button>
            </p>
          ) : stories.length === 0 ? (
            <p className="m-muted py-10">{q.trim() ? "No stories match that search." : EMPTY[tab]}</p>
          ) : (
            <>
              {stories.map((s) => (
                <StoryRow
                  key={s.id}
                  story={s}
                  href={`/dashboard/articles/${s.slug}`}
                  authorHref={s.author.memberId ? `/dashboard/family/${s.author.memberId}` : null}
                  busy={busy}
                  onLike={() => like.mutate({ id: s.id, liked: !s.likedByMe, slug: s.slug })}
                  onBookmark={() => save.mutate({ id: s.id, saved: !s.bookmarkedByMe, slug: s.slug })}
                />
              ))}
              <div className="mt-8">
                <Pagination page={page} pages={pages} onChange={setPage} label="Story pages" tone="mono" />
              </div>
            </>
          )}
        </div>

        <aside className="space-y-10 lg:sticky lg:top-6 lg:self-start">
          <label className="relative hidden sm:block">
            <span className="sr-only">Search stories</span>
            <Search size={17} aria-hidden="true" className="m-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="m-paper m-ink w-full rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-1 focus:ring-[var(--m-ink)]" />
          </label>
          <WriteCard href="/dashboard/articles/write" />
          <StaffPicks stories={(featured?.articles ?? []).map(fromCard)} basePath="/dashboard/articles" />
        </aside>
      </div>
    </MediumPage>
  );
}
