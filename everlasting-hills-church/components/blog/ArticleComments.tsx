"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { Pagination } from "@/components/dashboard/member/family/Pagination";
import { MAvatar } from "@/components/medium/parts";
import { useArticleComments, useDeleteArticleComment, usePostArticleComment } from "@/lib/api/blog";

const NAME_KEY = "ehc.blog.name";
const MAX = 1000;

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Africa/Lagos" });

/**
 * Responses under an article, Medium-style. On the public blog a visitor
 * gives a name; inside the app a member responds as themselves and can remove
 * what they may (their own, on their own article, or as an admin).
 */
export default function ArticleComments({ slug, asMember }: { slug: string; asMember: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useArticleComments(slug, page, asMember);
  const post = usePostArticleComment(slug, asMember);
  const remove = useDeleteArticleComment();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // A visitor's name is remembered on this device for the next response.
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
      setError((err as { message?: string }).message ?? "Could not post your response. Please try again.");
    }
  }

  return (
    <section id="comments" aria-labelledby="comments-title" className="scroll-mt-24">
      <h2 id="comments-title" className="m-ink text-xl font-bold">
        Responses{data?.total ? ` (${data.total})` : ""}
      </h2>

      <div className="mt-5">
        {isLoading ? (
          <div className="m-paper h-20 animate-pulse" />
        ) : isError ? (
          <p role="alert" className="m-muted text-sm">
            Responses could not load.{" "}
            <button type="button" onClick={() => refetch()} className="m-ink min-h-11 underline">
              Try again
            </button>
          </p>
        ) : !data || data.total === 0 ? (
          <p className="m-muted text-sm">No responses yet. Be the first.</p>
        ) : (
          <>
            <ul className="divide-y m-rule">
              {data.items.map((c) => (
                <li key={c.id} className="py-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 text-sm">
                      <MAvatar name={c.authorName} photoUrl={c.photoUrl} size={32} />
                      <div>
                        {asMember && c.memberId ? (
                          <Link href={`/dashboard/family/${c.memberId}`} className="m-ink m-link font-medium">
                            {c.authorName}
                          </Link>
                        ) : (
                          <span className="m-ink font-medium">{c.authorName}</span>
                        )}
                        {c.isMember && <span className="m-muted ml-2 text-[12px]">Member</span>}
                        <p className="m-muted text-[13px]">{when(c.createdAt)}</p>
                      </div>
                    </div>
                    {c.canDelete && (
                      <button type="button" onClick={() => setRemoving(c.id)} aria-label={`Remove ${c.authorName}'s comment`} className="m-icon-btn">
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <p className="m-ink m-serif mt-3 whitespace-pre-line break-words text-[17px] leading-relaxed">{c.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Pagination page={page} pages={pages} onChange={setPage} label="Response pages" tone="mono" />
            </div>
          </>
        )}
      </div>


      <form onSubmit={submit} className="m-paper mt-8 space-y-3 border m-rule p-4">
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>
        {!asMember && (
          <div>
            <label htmlFor="comment-name" className="m-muted mb-1 block text-[13px]">
              Your name
            </label>
            <input id="comment-name" className="m-input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="comment-body" className="m-muted mb-1 block text-[13px]">
            Your comment
          </label>
          <textarea
            id="comment-body"
            rows={3}
            className="m-input m-serif resize-y"
            value={body}
            onChange={(e) => {
              setBody(e.target.value.slice(0, MAX));
              setThanks(false);
            }}
            placeholder="What are your thoughts?"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-muted text-[13px]" aria-live="polite">
            {thanks ? "Thank you, your response is up." : asMember ? "You respond as yourself." : "Your name shows with your response. Please keep it kind."}
          </p>
          <button type="submit" disabled={post.isPending || !body.trim()} className="m-pill">
            {post.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            Respond
          </button>
        </div>
        {error && (
          <p role="alert" className="m-ink text-sm">
            {error}
          </p>
        )}
      </form>

      <ConfirmDialog
        open={removing != null}
        tone="danger"
        title="Remove this response?"
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
