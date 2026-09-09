"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, PencilLine, Sparkles } from "lucide-react";
import ArticleTabs from "./ArticleTabs";
import { Byline, LikeButton, ScriptureChip } from "./ArticleMeta";
import {
  useArticleFeed,
  useSetArticleLike,
  type ArticleCard,
} from "@/lib/api/articles";

/**
 * What the church is learning.
 *
 * Laid out like a publication rather than a dashboard table: one lead piece,
 * then a single readable column. The excerpt is the pitch, so it gets room, and
 * everything else on a card is small enough to skim past.
 */
export default function ArticleFeed() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useArticleFeed(page);
  const like = useSetArticleLike();

  const articles = data?.articles ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.meta.limit ?? 20)));

  // Only the first page gets a lead: on page two "featured" has already been
  // seen, and promoting an arbitrary article there would be a lie about rank.
  const lead = page === 1 && articles.length > 2 ? articles[0] : null;
  const rest = lead ? articles.slice(1) : articles;

  function toggleLike(article: ArticleCard) {
    like.mutate({ id: article.id, liked: !article.likedByMe, slug: article.slug });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <ArticleTabs />

      <header className="mt-6 border-b border-gray-100 pb-6 dark:border-white/10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#111] dark:text-white sm:text-4xl">
          What we are learning
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8a7e80] dark:text-white/45">
          Written by the church, for the church. Read what somebody found in
          scripture this week, and write your own when something lands.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-8 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
              <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyFeed />
      ) : (
        <>
          {lead && <LeadCard article={lead} onLike={() => toggleLike(lead)} />}

          <ol className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.07]">
            {rest.map((article) => (
              <li key={article.id}>
                <Row article={article} onLike={() => toggleLike(article)} />
              </li>
            ))}
          </ol>
        </>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40 dark:border-white/10 dark:text-white/60"
          >
            <ChevronLeft size={13} /> Newer
          </button>
          <span className="text-[11px] text-gray-400 dark:text-white/35">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40 dark:border-white/10 dark:text-white/60"
          >
            Older <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function LeadCard({ article, onLike }: { article: ArticleCard; onLike: () => void }) {
  return (
    <article className="mt-8">
      {article.featuredAt && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <Sparkles size={11} /> Featured
        </p>
      )}

      <Link href={`/dashboard/articles/${article.slug}`} className="group block">
        {article.coverImageUrl && (
          <div className="relative mb-4 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5">
            <Image
              src={article.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <h2 className="font-serif text-2xl font-bold leading-snug tracking-tight text-[#111] group-hover:text-[#87102C] dark:text-white dark:group-hover:text-[#FFB3C1] sm:text-3xl">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-gray-600 dark:text-white/55">
            {article.excerpt}
          </p>
        )}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Byline
          author={article.Author}
          publishedAt={article.publishedAt}
          readingMinutes={article.readingMinutes}
          size={32}
        />
        <div className="flex items-center gap-2">
          <ScriptureChip label={article.scriptureLabel} />
          <LikeButton liked={article.likedByMe} count={article.likeCount} onToggle={onLike} />
        </div>
      </div>

      <hr className="mt-8 border-gray-100 dark:border-white/10" />
    </article>
  );
}

function Row({ article, onLike }: { article: ArticleCard; onLike: () => void }) {
  return (
    <article className="py-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Byline
              author={article.Author}
              publishedAt={article.publishedAt}
              readingMinutes={article.readingMinutes}
              size={22}
            />
            {article.featuredAt && (
              <Sparkles size={12} className="text-amber-500" aria-label="Featured" />
            )}
          </div>

          <Link href={`/dashboard/articles/${article.slug}`} className="group mt-2.5 block">
            <h2 className="font-serif text-lg font-bold leading-snug text-[#111] group-hover:text-[#87102C] dark:text-white dark:group-hover:text-[#FFB3C1]">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/45">
                {article.excerpt}
              </p>
            )}
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ScriptureChip label={article.scriptureLabel} />
            <LikeButton liked={article.likedByMe} count={article.likeCount} onToggle={onLike} />
          </div>
        </div>

        {/* The thumbnail is the one thing that may be dropped on a phone: a
            120px crop of a wide image tells a reader nothing the headline has
            not already told them. */}
        {article.coverImageUrl && (
          <Link
            href={`/dashboard/articles/${article.slug}`}
            className="relative hidden h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:block dark:bg-white/5"
            aria-hidden
            tabIndex={-1}
          >
            <Image
              src={article.coverImageUrl}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          </Link>
        )}
      </div>
    </article>
  );
}

function EmptyFeed() {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-white/10">
      <PencilLine size={22} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
      <p className="font-serif text-lg font-bold text-[#111] dark:text-white">
        Nobody has written yet.
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#8a7e80] dark:text-white/45">
        Somebody has to be first. If a passage stayed with you this week, write a
        few paragraphs about it.
      </p>
      <Link
        href="/dashboard/articles/write"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24]"
      >
        <PencilLine size={15} /> Write the first one
      </Link>
    </div>
  );
}
