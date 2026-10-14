"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Heart, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { MTabs } from "@/components/medium/parts";
import { storyDate } from "@/components/medium/story";
import { useDeleteArticle, useMyArticles, type ArticleStatus, type MyArticle } from "@/lib/api/articles";
import ArticleTabs, { MediumPage } from "./ArticleTabs";

type Tab = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
const TAB_LABEL: Record<Tab, string> = {
  DRAFT: "Drafts",
  PENDING_REVIEW: "Waiting for approval",
  PUBLISHED: "Published",
  ARCHIVED: "Taken down",
};
const EMPTY: Record<Tab, string> = {
  DRAFT: "No drafts. Start one whenever something lands.",
  PENDING_REVIEW: "Nothing waiting. Submitted stories wait here for the head of comms or an admin.",
  PUBLISHED: "Nothing published yet. Approved stories appear to the church and on the public blog.",
  ARCHIVED: "Nothing taken down.",
};

/**
 * "Your stories", as Medium has it: drafts, waiting, published and taken
 * down, each a quiet list with what to do next.
 */
export default function MyArticles() {
  const { data, isLoading, error, refetch } = useMyArticles();
  const remove = useDeleteArticle();
  const [deleting, setDeleting] = useState<MyArticle | null>(null);
  const counts = useMemo(() => {
    const c: Record<ArticleStatus, number> = { DRAFT: 0, PENDING_REVIEW: 0, PUBLISHED: 0, ARCHIVED: 0 };
    for (const a of data ?? []) c[a.status] += 1;
    return c;
  }, [data]);
  const first = (Object.keys(TAB_LABEL) as Tab[]).find((t) => counts[t] > 0) ?? "DRAFT";
  const [chosen, setChosen] = useState<Tab | null>(null);
  const tab = chosen ?? first;
  const items = (data ?? []).filter((a) => a.status === tab);

  return (
    <MediumPage>
      <ArticleTabs />
      <div className="mx-auto max-w-[760px] pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="m-display m-ink text-[40px] leading-none sm:text-5xl">Your stories</h1>
          <Link href="/dashboard/articles/write" className="m-pill">
            Write a story
          </Link>
        </div>

        <div className="mt-8">
          <MTabs
            tabs={(Object.keys(TAB_LABEL) as Tab[]).map((t) => ({ value: t, label: `${TAB_LABEL[t]}${counts[t] ? ` ${counts[t]}` : ""}` }))}
            value={tab}
            onChange={setChosen}
            label="Your stories by status"
          />
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-6" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="m-paper h-16 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="m-muted py-10">
            Your stories could not load.{" "}
            <button type="button" onClick={() => refetch()} className="m-ink min-h-11 underline">
              Try again
            </button>
          </p>
        ) : items.length === 0 ? (
          <p className="m-muted py-10">{EMPTY[tab]}</p>
        ) : (
          <ul>
            {items.map((a) => {
              const view = `/dashboard/articles/${a.slug}`;
              return (
                <li key={a.id} className="border-b m-rule py-6">
                  <Link href={view} className="group block">
                    <h2 className="m-ink text-xl font-bold leading-snug group-hover:underline">{a.title}</h2>
                    {(a.subtitle || a.excerpt) && <p className="m-muted mt-1 line-clamp-2 text-[15px]">{a.subtitle || a.excerpt}</p>}
                  </Link>
                  {a.status === "DRAFT" && a.reviewNote && (
                    <p className="m-paper m-ink mt-3 border-l-2 border-[var(--m-ink)] px-3 py-2 text-sm">Changes requested: {a.reviewNote}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="m-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                      <span>
                        {a.status === "PUBLISHED" ? `Published ${storyDate(a.publishedAt)}` : `Last edited ${storyDate(a.updatedAt)}`}
                      </span>
                      <span>{a.readingMinutes} min read</span>
                      {a.status === "PUBLISHED" && (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <Eye size={13} aria-hidden="true" /> {a.viewCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart size={13} aria-hidden="true" /> {a.likeCount}
                          </span>
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      {a.status !== "ARCHIVED" && (
                        <Link href={`/dashboard/articles/write?slug=${a.slug}`} className="m-pill-outline !min-h-9 !px-4">
                          Edit
                        </Link>
                      )}
                      <button type="button" onClick={() => setDeleting(a)} aria-label={`Delete ${a.title}`} className="m-icon-btn">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deleting != null}
        tone="danger"
        title="Delete this story?"
        description={deleting ? `"${deleting.title}" will be gone for good, with its likes and responses.` : ""}
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove.mutateAsync(deleting.id).catch(() => {});
          setDeleting(null);
        }}
      />
    </MediumPage>
  );
}
