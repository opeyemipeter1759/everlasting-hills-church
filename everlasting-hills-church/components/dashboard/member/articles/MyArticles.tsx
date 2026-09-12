"use client";

import Link from "next/link";
import { Eye, Heart, Pencil, PencilLine } from "lucide-react";
import ArticleTabs from "./ArticleTabs";
import { formatDate } from "./ArticleMeta";
import { useMyArticles, type ArticleStatus, type MyArticle } from "@/lib/api/articles";

const STATUS_STYLE: Record<ArticleStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  PUBLISHED: {
    label: "Published",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/45",
  },
};

/**
 * A member's own shelf.
 *
 * Drafts come first, because an unfinished piece is the thing most likely to
 * have brought somebody here. Reads and likes sit on each row: quiet, but the
 * only evidence a writer gets that anybody is out there.
 */
export default function MyArticles() {
  const { data, isLoading } = useMyArticles();
  const articles = data ?? [];

  const drafts = articles.filter((a) => a.status === "DRAFT");
  const published = articles.filter((a) => a.status === "PUBLISHED");
  const archived = articles.filter((a) => a.status === "ARCHIVED");

  const totalReads = published.reduce((sum, a) => sum + a.viewCount, 0);
  const totalLikes = published.reduce((sum, a) => sum + a.likeCount, 0);

  return (
    <div className="mx-auto max-w-full md:px-5 py-6">
      <ArticleTabs />

      <header className="mt-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#111] dark:text-white">
          My writing
        </h1>
        {published.length > 0 && (
          <p className="mt-2 text-sm text-[#8a7e80] dark:text-white/45">
            {published.length} published · {totalReads} read{totalReads === 1 ? "" : "s"} ·{" "}
            {totalLikes} like{totalLikes === 1 ? "" : "s"}
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Empty />
      ) : (
        <div className="mt-8 space-y-8">
          <Section title="Drafts" articles={drafts} />
          <Section title="Published" articles={published} />
          <Section title="Archived" articles={archived} />
        </div>
      )}
    </div>
  );
}

function Section({ title, articles }: { title: string; articles: MyArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/35">
        {title}
      </h2>
      <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 dark:divide-white/[0.06] dark:border-white/10">
        {articles.map((article) => {
          const status = STATUS_STYLE[article.status];
          // A draft opens in the editor, since there is nothing to read yet.
          const href =
            article.status === "DRAFT"
              ? `/dashboard/articles/write?slug=${article.slug}`
              : `/dashboard/articles/${article.slug}`;

          return (
            <li key={article.id}>
              <div className="flex items-center gap-3 bg-white px-4 py-3.5 dark:bg-white/[0.02]">
                <Link href={href} className="group min-w-0 flex-1">
                  <p className="truncate font-serif text-[15px] font-bold text-[#111] group-hover:text-[#87102C] dark:text-white dark:group-hover:text-[#FFB3C1]">
                    {article.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#8a7e80] dark:text-white/40">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
                    {article.scriptureLabel && <span>{article.scriptureLabel}</span>}
                    {article.status === "PUBLISHED" && (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Eye size={10} /> {article.viewCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart size={10} /> {article.likeCount}
                        </span>
                      </>
                    )}
                  </p>
                </Link>

                <Link
                  href={`/dashboard/articles/write?slug=${article.slug}`}
                  aria-label={`Edit ${article.title}`}
                  className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#87102C] dark:text-white/35 dark:hover:bg-white/5 dark:hover:text-[#FFB3C1]"
                >
                  <Pencil size={14} />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Empty() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-white/10">
      <PencilLine size={22} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
      <p className="font-serif text-lg font-bold text-[#111] dark:text-white">
        You have not written anything yet.
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#8a7e80] dark:text-white/45">
        You do not have to be a teacher to write here. A few honest paragraphs
        about what a passage did in you is enough.
      </p>
      <Link
        href="/dashboard/articles/write"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24]"
      >
        <PencilLine size={15} /> Start writing
      </Link>
    </div>
  );
}
