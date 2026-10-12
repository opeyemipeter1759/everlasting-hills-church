"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { Pagination } from "@/components/dashboard/member/family/Pagination";
import { useArticleComments, useDeleteArticleComment, usePostArticleComment, type BlogComment } from "@/lib/api/blog";

const NAME_KEY = "ehc.blog.name";
const MAX = 1000;

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });

function Avatar({ c }: { c: BlogComment }) {
  const initials = c.authorName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return c.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.photoUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] text-xs font-bold text-[#87102C]">
      {initials || "?"}
    </span>
  );
}

/**
 * Comments under an article. On the public blog a visitor gives a name; inside
 * the app a member comments as themselves and can remove what they may.
 */
export default function ArticleComments({ slug, asMember }: { slug: string; asMember: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useArticleComments(slug, page, asMember);
  const post = usePostArticleComment(slug, asMember);
  const remove = useDeleteArticleComment();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // A visitor's name is remembered on this device for the next comment.
  useEffect(() => {
    try {
      setName(window.localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      // Storage blocked.
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!asMember && !name.trim()) return setError("Tell us your name.");
    if (!body.trim()) return;
    try {
      await post.mutateAsync({ name: name.trim(), body: body.trim(), ...(honeypot ? { website: honeypot } : {}) });
      try {
        if (!asMember) window.localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // Storage blocked.
      }
      setBody("");
      setThanks(true);
      setPage(1);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Could not post your comment. Please try again.");
    }
  }

  const field =
    "w-full rounded-xl border border-[#E7CDD3] bg-white px-4 py-3 text-[15px] text-[#111] focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white";

  return (
    <section id="comments" aria-labelledby="comments-title" className="scroll-mt-24">
      <h2 id="comments-title" className="inline-flex items-center gap-2 font-serif text-2xl font-bold text-[#111] dark:text-white">
        <MessageCircle size={20} aria-hidden="true" className="text-[#87102C] dark:text-[#FFB3C1]" />
        {data?.total ? `${data.total} ${data.total === 1 ? "comment" : "comments"}` : "Comments"}
      </h2>

      <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-[#E7CDD3]/70 bg-[#FFF8F9] p-4 dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-5">
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>
        {!asMember && (
          <div>
            <label htmlFor="comment-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A4A4D] dark:text-white/55">
              Your name
            </label>
            <input id="comment-name" className={field} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="comment-body" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A4A4D] dark:text-white/55">
            Your comment
          </label>
          <textarea
            id="comment-body"
            rows={3}
            className={`${field} resize-y`}
            value={body}
            onChange={(e) => {
              setBody(e.target.value.slice(0, MAX));
              setThanks(false);
            }}
            placeholder="What did this stir in you?"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#8a7e80] dark:text-white/40" aria-live="polite">
            {thanks ? "Thank you, your comment is up." : asMember ? "You comment as yourself." : "Your name shows with your comment. Please keep it kind."}
          </p>
          <button
            type="submit"
            disabled={post.isPending || !body.trim()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#87102C] px-6 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-50"
          >
            {post.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
            Post comment
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
        ) : !data || data.total === 0 ? (
          <p className="text-sm text-[#8a7e80] dark:text-white/45">No comments yet. Be the first.</p>
        ) : (
          <>
            <ul className="space-y-5">
              {data.items.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Avatar c={c} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">
                        {asMember && c.memberId ? (
                          <Link href={`/dashboard/family/${c.memberId}`} className="font-bold text-[#111] hover:underline dark:text-white">
                            {c.authorName}
                          </Link>
                        ) : (
                          <span className="font-bold text-[#111] dark:text-white">{c.authorName}</span>
                        )}
                        {c.isMember && (
                          <span className="ml-2 rounded-full bg-[#FFE8ED] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#87102C]">Member</span>
                        )}
                        <span className="ml-2 text-xs text-[#8a7e80] dark:text-white/40">{when(c.createdAt)}</span>
                      </p>
                      {c.canDelete && (
                        <button
                          type="button"
                          onClick={() => setRemoving(c.id)}
                          aria-label={`Remove ${c.authorName}'s comment`}
                          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[#8a7e80] hover:text-red-600"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-[#2b2325] dark:text-white/80">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Pagination page={page} pages={pages} onChange={setPage} label="Comment pages" />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={removing != null}
        tone="danger"
        title="Remove this comment?"
        description="It will be removed for everyone, on the website and in the app."
        confirmLabel="Remove"
        loading={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) await remove.mutateAsync(removing).catch(() => {});
          setRemoving(null);
        }}
      />
    </section>
  );
}
