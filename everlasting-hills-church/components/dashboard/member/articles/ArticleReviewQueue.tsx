"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import ArticleTabs from "./ArticleTabs";
import { AuthorAvatar, formatDate } from "./ArticleMeta";
import { authorName, useArticleReviewAccess, useArticleReviewQueue } from "@/lib/api/articles";

export default function ArticleReviewQueue() {
  const access = useArticleReviewAccess();
  const queue = useArticleReviewQueue(access.data?.canReview === true);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5">
      <ArticleTabs />
      <h1 className="mt-6 font-serif text-3xl font-bold text-[#111] dark:text-white">Article approvals</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-white/50">Read each submission, then approve it for the church or return it with feedback.</p>
      {access.isLoading || (access.data?.canReview && queue.isLoading) ? (
        <p role="status" className="mt-8 text-sm text-gray-500">Loading submissions...</p>
      ) : access.error || queue.error ? (
        <div role="alert" className="mt-8 text-sm text-red-600">
          Submissions could not be loaded. <button type="button" className="underline" onClick={() => { void access.refetch(); if (access.data?.canReview) void queue.refetch(); }}>Try again</button>
        </div>
      ) : !access.data?.canReview ? (
        <p className="mt-8 rounded-2xl border border-gray-200 p-5 text-sm dark:border-white/10">Reviews are available to the HOD overseeing the Content Writing Team, pastors and church administrators.</p>
      ) : !queue.data?.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center dark:border-white/10">
          <ClipboardCheck className="mx-auto text-[#87102C] dark:text-[#FFB3C1]" />
          <p className="mt-3 font-semibold dark:text-white">No articles waiting for your review</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">Your own submissions appear under My writing for another reviewer to approve.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {queue.data.map((article) => (
            <li key={article.id}>
              <Link href={`/dashboard/articles/${article.slug}`} className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#87102C]/40 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <AuthorAvatar author={article.Author} size={36} />
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold dark:text-white">{authorName(article.Author)}</p>
                    <p className="text-xs text-gray-500 dark:text-white/45">Submitted {formatDate(article.submittedAt)} · {article.readingMinutes} min read</p>
                  </div>
                </div>
                <h2 className="mt-3 break-words font-serif text-xl font-bold text-[#111] dark:text-white">{article.title}</h2>
                {article.excerpt && <p className="mt-2 line-clamp-3 break-words text-sm text-gray-600 dark:text-white/60">{article.excerpt}</p>}
                <span className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[#87102C] dark:text-[#FFB3C1]">Read and review →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
