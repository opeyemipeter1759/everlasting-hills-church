"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Eye, Pencil, Sparkles } from "lucide-react";
import RichText from "@/components/ui/display/RichText";
import { AuthorAvatar, LikeButton, ScriptureChip, formatDate } from "./ArticleMeta";
import {
  authorName,
  useArticle,
  useArticleFeed,
  useSetArticleFeatured,
  useSetArticleLike,
} from "@/lib/api/articles";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { normalizeRole } from "@/lib/auth/frontend-session";

const MODERATOR_ROLES = new Set(["PASTOR", "ADMIN", "ADMIN_HEAD", "SUPER_ADMIN"]);

/**
 * One article, read.
 *
 * A single column at a comfortable measure, serif headline, body at 17px. The
 * furniture — like, edit, feature — is pushed to the ends so the middle of the
 * screen is only ever the writing.
 */
export default function ArticleReader({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: article, isLoading, error } = useArticle(slug);
  const like = useSetArticleLike();
  const feature = useSetArticleFeatured();
  const user = useCurrentUser();
  const canModerate = MODERATOR_ROLES.has(normalizeRole(user?.role) ?? "");

  // The next few pieces, so finishing one leads somewhere.
  const { data: feed } = useArticleFeed(1);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-full space-y-4 px-5 py-10">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="h-9 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-full md:px-5 py-16 text-center">
        <BookOpen size={22} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="font-serif text-lg font-bold text-[#111] dark:text-white">
          This article is not here.
        </p>
        <p className="mt-1.5 text-sm text-[#8a7e80] dark:text-white/45">
          It may have been unpublished by its author.
        </p>
        <Link
          href="/dashboard/articles"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24]"
        >
          Back to the feed
        </Link>
      </div>
    );
  }

  const more = (feed?.articles ?? []).filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-2xl px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/articles")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#87102C] dark:text-white/45 dark:hover:text-[#FFB3C1]"
        >
          <ArrowLeft size={14} /> All articles
        </button>

        <div className="flex items-center gap-2">
          {article.isAuthor && (
            <Link
              href={`/dashboard/articles/write?slug=${article.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold text-gray-600 hover:border-[#87102C]/30 hover:text-[#87102C] dark:border-white/10 dark:text-white/55 dark:hover:text-[#FFB3C1]"
            >
              <Pencil size={11} /> Edit
            </Link>
          )}
          {canModerate && (
            <button
              type="button"
              onClick={() =>
                feature.mutate({ id: article.id, featured: !article.featuredAt })
              }
              disabled={feature.isPending}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors disabled:opacity-60 ${
                article.featuredAt
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                  : "border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700 dark:border-white/10 dark:text-white/55"
              }`}
            >
              <Sparkles size={11} />
              {article.featuredAt ? "Featured" : "Feature"}
            </button>
          )}
        </div>
      </div>

      {article.status === "DRAFT" && (
        <p className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-2.5 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          This is a draft. Only you can see it.
        </p>
      )}

      <header className="mt-6">
        <ScriptureChip label={article.scriptureLabel} />
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.15] tracking-tight text-[#111] dark:text-white sm:text-[2.6rem]">
          {article.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-gray-100 py-4 dark:border-white/10">
          <AuthorAvatar author={article.Author} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#111] dark:text-white">
              {authorName(article.Author)}
            </p>
            <p className="text-[11px] text-[#8a7e80] dark:text-white/40">
              {formatDate(article.publishedAt ?? article.createdAt)} · {article.readingMinutes} min
              read
              {article.viewCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Eye size={10} /> {article.viewCount}
                </span>
              )}
            </p>
          </div>
          <LikeButton
            liked={article.likedByMe}
            count={article.likeCount}
            disabled={like.isPending}
            onToggle={() =>
              like.mutate({ id: article.id, liked: !article.likedByMe, slug: article.slug })
            }
          />
        </div>
      </header>

      {article.coverImageUrl && (
        <div className="relative mt-6 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5">
          <Image
            src={article.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
          />
        </div>
      )}

      {/* The body renders through the same Markdown subset the announcements
          use — React elements throughout, never dangerouslySetInnerHTML, which
          matters more here because this is member-written input. */}
      <div className="mt-8">
        <RichText
          text={article.body}
          density="comfortable"
          className="text-[17px] leading-[1.75] text-gray-800 dark:text-white/75"
          emphasisClassName="text-[#111] dark:text-white"
        />
      </div>

      {article.startVerseId && article.endVerseId && (
        <Link
          href="/dashboard/reading"
          className="mt-10 flex items-center gap-3 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 p-4 transition-colors hover:border-[#87102C]/30 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <BookOpen size={18} className="flex-shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">
              From the reading
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-700 dark:text-white/70">
              {article.scriptureLabel ?? "Read the passage"}
            </p>
          </div>
        </Link>
      )}

      <footer className="mt-12 border-t border-gray-100 pt-8 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[#8a7e80] dark:text-white/45">
            Did this help you? Let {authorName(article.Author).split(" ")[0]} know.
          </p>
          <LikeButton
            liked={article.likedByMe}
            count={article.likeCount}
            disabled={like.isPending}
            onToggle={() =>
              like.mutate({ id: article.id, liked: !article.likedByMe, slug: article.slug })
            }
          />
        </div>

        {more.length > 0 && (
          <>
            <h2 className="mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/35">
              Read next
            </h2>
            <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/[0.07]">
              {more.map((next) => (
                <li key={next.id}>
                  <Link
                    href={`/dashboard/articles/${next.slug}`}
                    className="group flex items-baseline justify-between gap-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-[15px] font-bold text-[#111] group-hover:text-[#87102C] dark:text-white dark:group-hover:text-[#FFB3C1]">
                        {next.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#8a7e80] dark:text-white/40">
                        {authorName(next.Author)} · {next.readingMinutes} min
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </footer>
    </article>
  );
}
