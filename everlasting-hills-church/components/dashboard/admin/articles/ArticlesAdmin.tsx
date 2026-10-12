"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ClipboardCheck, ExternalLink, Eye, Heart, MessageCircle, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { Pagination } from "@/components/dashboard/member/family/Pagination";
import {
  useArchiveArticle,
  useDeleteArticle,
  useDeleteArticleComment,
  useManagedArticles,
  useRecentArticleComments,
  type ManagedArticle,
} from "@/lib/api/blog";

const TABS = [
  { value: "", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PENDING_REVIEW", label: "Waiting for approval" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

const STATUS: Record<ManagedArticle["status"], { label: string; cls: string }> = {
  PUBLISHED: { label: "Published", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  PENDING_REVIEW: { label: "Waiting", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60" },
  ARCHIVED: { label: "Archived", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }) : "—";

/**
 * Every member article, for pastors and admins: what is live on the public
 * blog, what waits for approval, and the comments coming in. An article can
 * be taken off the site (archived) or deleted for good; a comment removed.
 */
export default function ArticlesAdmin() {
  const [status, setStatus] = useState("");
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

  const { data, isLoading, isError } = useManagedArticles({ status, q, page });
  const comments = useRecentArticleComments();
  const archive = useArchiveArticle();
  const remove = useDeleteArticle();
  const removeComment = useDeleteArticleComment();
  const [deleting, setDeleting] = useState<ManagedArticle | null>(null);
  const [archiving, setArchiving] = useState<ManagedArticle | null>(null);
  const [removingComment, setRemovingComment] = useState<string | null>(null);
  // Shown, not swallowed: a refused delete must say why.
  const [actionError, setActionError] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "That did not work. Please try again.");
    }
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">Administration</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Articles</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            Members&apos; articles on the public blog. Take one off the site, delete it, or remove comments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/articles/review" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-semibold text-white hover:bg-[#6E0C24]">
            <ClipboardCheck size={15} aria-hidden="true" /> Approvals
          </Link>
          <a href="/articles" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/70">
            <ExternalLink size={15} aria-hidden="true" /> Public blog
          </a>
        </div>
      </header>

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={status === t.value}
            onClick={() => {
              setStatus(t.value);
              setPage(1);
            }}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
              status === t.value ? "bg-[#87102C] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">Search articles by title</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#161618]">
        {isLoading ? (
          <div className="h-48 animate-pulse bg-gray-50 dark:bg-white/5" />
        ) : isError || !data ? (
          <p role="alert" className="p-6 text-sm text-gray-500">
            Could not load articles.
          </p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-white/50">No articles here.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {data.items.map((a) => {
              const href = a.status === "PUBLISHED" ? `/articles/${a.slug}` : `/dashboard/articles/${a.slug}`;
              return (
                <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
                      {a.featuredAt && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Featured</span>}
                    </div>
                    <a href={href} target={a.status === "PUBLISHED" ? "_blank" : undefined} rel="noopener noreferrer" className="mt-1 block truncate font-semibold text-gray-900 hover:text-[#87102C] dark:text-white">
                      {a.title}
                    </a>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-white/45">
                      {a.author.name} · {a.status === "PUBLISHED" ? `Published ${fmt(a.publishedAt)}` : `Updated ${fmt(a.updatedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-white/45">
                    <span className="inline-flex items-center gap-1" title="Reads">
                      <Eye size={13} aria-hidden="true" /> {a.viewCount}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Likes">
                      <Heart size={13} aria-hidden="true" /> {a.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Comments">
                      <MessageCircle size={13} aria-hidden="true" /> {a.commentCount}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {a.status === "PUBLISHED" && (
                      <button
                        type="button"
                        onClick={() => setArchiving(a)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/70"
                      >
                        <Archive size={13} aria-hidden="true" /> Take down
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleting(a)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400"
                    >
                      <Trash2 size={13} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Pagination page={page} pages={pages} onChange={setPage} label="Article pages" />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#161618]">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Newest comments</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-white/45">From the public blog and the app. Remove anything unkind or spam.</p>
        {comments.isLoading ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-gray-50 dark:bg-white/5" />
        ) : !comments.data?.length ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-white/50">No comments yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
            {comments.data.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{c.authorName}</span>
                    {!c.isMember && <span className="ml-2 text-[11px] text-gray-400">visitor</span>}
                    <span className="ml-2 text-xs text-gray-400">on </span>
                    <a href={`/articles/${c.article.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#87102C] hover:underline">
                      {c.article.title}
                    </a>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-white/65">{c.body}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{fmt(c.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemovingComment(c.id)}
                  aria-label={`Remove ${c.authorName}'s comment`}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deleting != null}
        tone="danger"
        title="Delete this article for good?"
        description={deleting ? `"${deleting.title}" by ${deleting.author.name} will be removed from the website and the app, with its comments and likes. This cannot be undone.` : ""}
        confirmLabel="Delete article"
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await run(() => remove.mutateAsync(deleting.id));
          setDeleting(null);
        }}
      />
      <ConfirmDialog
        open={archiving != null}
        tone="warning"
        title="Take this article off the site?"
        description="It stops showing on the public blog and in the app. The author keeps it, and it can be published again."
        confirmLabel="Take down"
        loading={archive.isPending}
        onCancel={() => setArchiving(null)}
        onConfirm={async () => {
          if (archiving) await run(() => archive.mutateAsync(archiving.id));
          setArchiving(null);
        }}
      />
      <ConfirmDialog
        open={removingComment != null}
        tone="danger"
        title="Remove this comment?"
        description="It will be removed for everyone."
        confirmLabel="Remove"
        loading={removeComment.isPending}
        onCancel={() => setRemovingComment(null)}
        onConfirm={async () => {
          if (removingComment) await run(() => removeComment.mutateAsync(removingComment));
          setRemovingComment(null);
        }}
      />
    </div>
  );
}
