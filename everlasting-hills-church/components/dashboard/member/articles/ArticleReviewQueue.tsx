"use client";

import Link from "next/link";
import { MAvatar } from "@/components/medium/parts";
import { storyDate } from "@/components/medium/story";
import { authorName, useArticleReviewAccess, useArticleReviewQueue } from "@/lib/api/articles";
import ArticleTabs, { MediumPage } from "./ArticleTabs";

/** Stories waiting for the head of comms, a pastor or an admin to approve. */
export default function ArticleReviewQueue() {
  const access = useArticleReviewAccess();
  const queue = useArticleReviewQueue(access.data?.canReview === true);

  return (
    <MediumPage>
      <ArticleTabs />
      <div className="mx-auto max-w-[760px] pt-8">
        <h1 className="m-display m-ink text-[40px] leading-none sm:text-5xl">Waiting for review</h1>
        <p className="m-muted mt-3 text-base">Read each one through, then approve it for the church and the public blog, or send it back with a note.</p>

        {access.isLoading || (access.data?.canReview && queue.isLoading) ? (
          <div className="mt-8 space-y-6" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="m-paper h-20 animate-pulse" />
            ))}
          </div>
        ) : access.error || queue.error ? (
          <p role="alert" className="m-muted mt-8">
            Submissions could not load.{" "}
            <button
              type="button"
              className="m-ink min-h-11 underline"
              onClick={() => {
                void access.refetch();
                if (access.data?.canReview) void queue.refetch();
              }}
            >
              Try again
            </button>
          </p>
        ) : !access.data?.canReview ? (
          <p className="m-paper m-ink mt-8 border m-rule p-5 text-sm">
            Reviews are for the head of comms (the Content Writing Team&apos;s department head), pastors and church admins.
          </p>
        ) : !queue.data?.length ? (
          <p className="m-muted mt-10">Nothing waiting for you. Your own submissions wait for another reviewer.</p>
        ) : (
          <ul className="mt-6">
            {queue.data.map((article) => (
              <li key={article.id} className="border-b m-rule py-7">
                <div className="flex items-center gap-2 text-[13px]">
                  <MAvatar name={authorName(article.Author)} photoUrl={article.Author?.Member?.photoUrl ?? null} size={22} />
                  <span className="m-ink">{authorName(article.Author)}</span>
                  <span className="m-muted">· submitted {storyDate(article.submittedAt)}</span>
                </div>
                <Link href={`/dashboard/articles/${article.slug}`} className="group mt-3 block">
                  <h2 className="m-ink break-words text-xl font-bold leading-snug group-hover:underline">{article.title}</h2>
                  {article.excerpt && <p className="m-muted mt-1 line-clamp-2 break-words text-[15px]">{article.excerpt}</p>}
                </Link>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="m-muted text-[13px]">{article.readingMinutes} min read</span>
                  <Link href={`/dashboard/articles/${article.slug}`} className="m-pill !min-h-9 !px-4">
                    Read and review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MediumPage>
  );
}
