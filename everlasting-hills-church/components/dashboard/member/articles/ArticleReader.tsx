"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { ArrowLeft, Archive, Trash2, BookOpen, Bookmark, BookmarkCheck, ExternalLink, Heart, MessageCircle, Pencil, Sparkles } from "lucide-react";
import ReadingView from "@/components/medium/ReadingView";
import ShareMenu from "@/components/medium/ShareMenu";
import { MAvatar, StoryRow } from "@/components/medium/parts";
import { compact, fromCard } from "@/components/medium/story";
import ArticleComments from "@/components/blog/ArticleComments";
import { publicArticleUrl } from "@/lib/api/blog";
import {
  authorName,
  useArticle,
  useArticleFeed,
  useDeleteArticle,
  useSetArticleBookmark,
  useUpdateArticle,
  useSetArticleFeatured,
  useSetArticleLike,
} from "@/lib/api/articles";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { normalizeRole } from "@/lib/auth/frontend-session";
import ArticleReviewActions from "./ArticleReviewActions";
import ReviewNotes from "./ReviewNotes";
import { MediumPage } from "./ArticleTabs";

const MODERATOR_ROLES = new Set(["PASTOR", "ADMIN", "ADMIN_HEAD", "SUPER_ADMIN"]);

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="m-paper m-ink border-l-2 border-[var(--m-ink)] px-4 py-3 text-sm">{children}</p>;
}

/**
 * One story, read in the app: the Medium reading column, with like, save,
 * responses and share in the action bar, and the author's and moderators'
 * tools where they apply.
 */
export default function ArticleReader({ slug }: { slug: string }) {
  const { data: article, isLoading, error } = useArticle(slug);
  const like = useSetArticleLike();
  const save = useSetArticleBookmark();
  const feature = useSetArticleFeatured();
  const remove = useDeleteArticle();
  const takeDown = useUpdateArticle();
  const router = useRouter();
  const [confirm, setConfirm] = useState<"delete" | "archive" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const user = useCurrentUser();
  const canModerate = MODERATOR_ROLES.has(normalizeRole(user?.role) ?? "");
  // The next few pieces, so finishing one leads somewhere.
  const { data: feed } = useArticleFeed(1);

  const back = (
    <Link href="/dashboard/articles" className="m-muted inline-flex min-h-11 items-center gap-1.5 text-sm hover:text-[var(--m-ink)]">
      <ArrowLeft size={15} aria-hidden="true" /> All stories
    </Link>
  );

  if (isLoading) {
    return (
      <MediumPage>
        <div className="mx-auto max-w-[680px] space-y-5 pt-10" aria-busy="true">
          <div className="m-paper h-10 w-3/4 animate-pulse" />
          <div className="m-paper h-5 w-1/2 animate-pulse" />
          <div className="m-paper h-64 animate-pulse" />
        </div>
      </MediumPage>
    );
  }

  if (error || !article) {
    return (
      <MediumPage>
        <div className="mx-auto max-w-[680px] py-16 text-center">
          <BookOpen size={24} className="m-muted mx-auto mb-3" aria-hidden="true" />
          <p className="m-display m-ink text-3xl">This story is not here.</p>
          <p className="m-muted mt-2 text-sm">It may have been unpublished or taken down.</p>
          <Link href="/dashboard/articles" className="m-pill mt-6">
            Back to stories
          </Link>
        </div>
      </MediumPage>
    );
  }

  const published = article.status === "PUBLISHED";
  // Pastors and admins (super admins included) can take down or delete anyone's story.
  const canRemove = article.isAuthor || canModerate;

  async function act(kind: "delete" | "archive") {
    if (!article) return;
    setActionError(null);
    try {
      if (kind === "delete") await remove.mutateAsync(article.id);
      // Taken down = back to waiting for approval: off the site, still here for reviewers.
      else await takeDown.mutateAsync({ id: article.id, revision: article.revision, status: "PENDING_REVIEW" });
      setConfirm(null);
      router.push(kind === "delete" ? "/dashboard/articles" : `/dashboard/articles/${article.slug}`);
    } catch (err) {
      setConfirm(null);
      setActionError((err as { message?: string }).message ?? "That did not work. Please try again.");
    }
  }
  const name = authorName(article.Author);
  const memberId = article.Author?.Member?.id ?? null;
  const profileHref = memberId ? `/dashboard/family/${memberId}` : null;
  const more = (feed?.articles ?? []).filter((a) => a.slug !== slug).slice(0, 3);
  const notice =
    article.status === "DRAFT" ? (
      <Notice>{article.reviewNote ? `Changes requested: ${article.reviewNote}` : "This is a draft. Only you can see it."}</Notice>
    ) : article.status === "PENDING_REVIEW" ? (
      <Notice>
        {article.canReview
          ? "Waiting for your review. Read it through, then use the review form at the end."
          : "Waiting for approval by the head of comms or an admin. It appears to the church and on the public blog once approved."}
      </Notice>
    ) : article.status === "ARCHIVED" ? (
      <Notice>This story has been taken off the site.</Notice>
    ) : null;

  return (
    <MediumPage>
      <ReadingView
        back={
          <div className="flex items-center justify-between gap-3">
            {back}
            <div className="flex items-center gap-2">
              {article.isAuthor && (
                <Link href={`/dashboard/articles/write?slug=${article.slug}`} className="m-pill-outline !min-h-9 !px-4">
                  <Pencil size={14} aria-hidden="true" /> Edit
                </Link>
              )}
              {canModerate && published && (
                <button
                  type="button"
                  onClick={() => feature.mutate({ id: article.id, featured: !article.featuredAt })}
                  disabled={feature.isPending}
                  aria-pressed={!!article.featuredAt}
                  className={article.featuredAt ? "m-pill !min-h-9 !px-4" : "m-pill-outline !min-h-9 !px-4"}
                >
                  <Sparkles size={14} aria-hidden="true" /> {article.featuredAt ? "Featured" : "Feature"}
                </button>
              )}
              {canModerate && !article.isAuthor && published && (
                <button type="button" onClick={() => setConfirm("archive")} className="m-pill-outline !min-h-9 !px-4">
                  <Archive size={14} aria-hidden="true" /> Take down
                </button>
              )}
              {canRemove && (
                <button type="button" onClick={() => setConfirm("delete")} className="m-pill-outline !min-h-9 !px-4">
                  <Trash2 size={14} aria-hidden="true" /> Delete
                </button>
              )}
            </div>
          </div>
        }
        bodyId="article-body"
        notice={
          actionError ? (
            <>
              <p role="alert" className="m-paper m-ink border-l-2 border-[var(--m-ink)] px-4 py-3 text-sm">
                {actionError}
              </p>
              {notice && <div className="mt-3">{notice}</div>}
            </>
          ) : (
            notice
          )
        }
        article={{
          title: article.title,
          subtitle: article.subtitle?.trim() || null,
          body: article.body,
          coverImageUrl: article.coverImageUrl,
          scriptureLabel: article.scriptureLabel,
          readingMinutes: article.readingMinutes,
          publishedAt: article.publishedAt ?? article.createdAt,
          author: { name, photoUrl: article.Author?.Member?.photoUrl ?? null, href: profileHref },
        }}
        actions={
          published ? (
            <>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-pressed={article.likedByMe}
                  aria-label={article.likedByMe ? "Unlike" : "Like"}
                  disabled={like.isPending}
                  onClick={() => like.mutate({ id: article.id, liked: !article.likedByMe, slug: article.slug })}
                  className="m-icon-btn text-sm"
                >
                  <Heart size={19} aria-hidden="true" fill={article.likedByMe ? "currentColor" : "none"} /> {compact(article.likeCount)}
                </button>
                <a href="#comments" className="m-icon-btn text-sm" aria-label={`${article.commentCount ?? 0} responses`}>
                  <MessageCircle size={19} aria-hidden="true" /> {compact(article.commentCount ?? 0)}
                </a>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={!!article.bookmarkedByMe}
                  aria-label={article.bookmarkedByMe ? "Remove from saved" : "Save for later"}
                  disabled={save.isPending}
                  onClick={() => save.mutate({ id: article.id, saved: !article.bookmarkedByMe, slug: article.slug })}
                  className="m-icon-btn"
                >
                  {article.bookmarkedByMe ? <BookmarkCheck size={19} aria-hidden="true" /> : <Bookmark size={19} aria-hidden="true" />}
                </button>
                <ShareMenu url={publicArticleUrl(article.slug)} title={article.title} />
                <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer" className="m-icon-btn" aria-label="Open on the public website">
                  <ExternalLink size={18} aria-hidden="true" />
                </a>
              </div>
            </>
          ) : undefined
        }
        footer={
          <>
            {/* Comments and suggestions on passages, Google Docs style; never a decision. */}
            <ReviewNotes articleId={article.id} bodyId="article-body" enabled={article.isAuthor || article.canReview || canModerate} />
            {article.canReview && <ArticleReviewActions article={article} />}

            {article.startVerseId && article.endVerseId && (
              <Link href="/dashboard/reading" className="m-paper mt-12 flex items-center gap-3 border m-rule p-4 hover:bg-[var(--m-line)]">
                <BookOpen size={18} className="m-ink flex-shrink-0" aria-hidden="true" />
                <span className="m-ink text-sm">From the reading: {article.scriptureLabel ?? "read the passage"}</span>
              </Link>
            )}

            {published && (
              <>
                <section className="mt-12 flex items-start gap-4 border-y m-rule py-10">
                  <MAvatar name={name} photoUrl={article.Author?.Member?.photoUrl ?? null} size={64} />
                  <div className="min-w-0">
                    <p className="m-ink text-xl font-bold">Written by {name}</p>
                    <p className="m-muted mt-1 text-sm">A member of the Everlasting Hills Church family.</p>
                    {profileHref && (
                      <Link href={profileHref} className="m-pill-outline mt-4 !min-h-9 !px-4">
                        View profile
                      </Link>
                    )}
                  </div>
                </section>

                <div className="mt-10">
                  <ArticleComments slug={article.slug} asMember />
                </div>

                {more.length > 0 && (
                  <section className="mt-14 border-t m-rule pt-8">
                    <h2 className="m-ink text-xl font-bold">More from the family</h2>
                    {more.map((a) => {
                      const s = fromCard(a);
                      return <StoryRow key={s.id} story={s} href={`/dashboard/articles/${s.slug}`} />;
                    })}
                  </section>
                )}
              </>
            )}
          </>
        }
      />
      <ConfirmDialog
        open={confirm != null}
        tone={confirm === "delete" ? "danger" : "warning"}
        title={confirm === "delete" ? "Delete this story for good?" : "Take this story off the site?"}
        description={
          confirm === "delete"
            ? `"${article.title}" will be removed from the app and the public blog, with its likes and responses. This cannot be undone.`
            : "It goes back to Waiting for approval: hidden from the church and the public blog, still visible to admins and reviewers, who can approve it again."
        }
        confirmLabel={confirm === "delete" ? "Delete" : "Take down"}
        loading={remove.isPending || takeDown.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => (confirm ? act(confirm) : undefined)}
      />
    </MediumPage>
  );
}
