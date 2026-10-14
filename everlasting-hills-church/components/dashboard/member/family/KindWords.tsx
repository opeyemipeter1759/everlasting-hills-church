"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, Quote, Send, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  useAddProfileComment,
  useDeleteProfileComment,
  useProfileComments,
  type FamilyPerson,
} from "@/lib/api/family";
import { card } from "./ProfileSections";
import { Pagination } from "./Pagination";

const MAX = 500;

/** Ways to begin, for anyone who wants to say something but not how. */
const STARTERS = [
  "I thank God for you because ",
  "You blessed me when ",
  "Something I admire about you is ",
  "My prayer for you is ",
];

function Avatar({ person, size = 40 }: { person: FamilyPerson; size?: number }) {
  const initials = person.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const style = { width: size, height: size };
  return person.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.photoUrl} alt="" style={style} className="flex-shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-[#140b10]" />
  ) : (
    <span
      style={style}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[#87102C] text-xs font-bold text-white ring-2 ring-white dark:ring-[#140b10]"
    >
      {initials}
    </span>
  );
}

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });

/**
 * "Write something nice about…": kind words members leave on each other's
 * profiles, shown like testimonials. The owner is told of each one, can
 * remove any, and a writer can remove their own.
 */
export default function KindWords({
  memberId,
  firstName,
  isMe,
  viewerId,
  isStaff = false,
}: {
  memberId: string;
  firstName: string;
  isMe: boolean;
  viewerId: string | null;
  isStaff?: boolean;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProfileComments(memberId, page);
  const add = useAddProfileComment(memberId);
  const remove = useDeleteProfileComment(memberId);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const total = data?.total ?? 0;

  function start(starter: string) {
    setText(starter);
    setPosted(false);
    window.setTimeout(() => {
      box.current?.focus();
      box.current?.setSelectionRange(starter.length, starter.length);
    }, 0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    try {
      await add.mutateAsync(text.trim());
      setText("");
      setPosted(true);
      setPage(1);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Could not post that. Please try again.");
    }
  }

  return (
    <section id="kind-words" aria-labelledby="kind-words-title" className={`${card} scroll-mt-24 overflow-hidden`}>
      <div className="bg-gradient-to-br from-[#FFF4F6] via-white to-[#FFF9EC] px-5 pb-5 pt-6 dark:from-[#87102C]/15 dark:via-transparent dark:to-[#C9A227]/10 sm:px-7">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">
          <Heart size={12} aria-hidden="true" fill="currentColor" /> Kind words{total > 0 ? ` · ${total}` : ""}
        </p>
        <h2 id="kind-words-title" className="mt-1.5 font-serif text-2xl font-bold text-[#111] dark:text-white">
          {isMe ? "What the family says about you" : `Write something nice about ${firstName}`}
        </h2>
        <p className="mt-1 text-sm text-[#5A4A4D] dark:text-white/60">
          {isMe
            ? "Kind words members have written on your profile. Everyone who visits can read them."
            : `A word of thanks, a memory, a prayer. ${firstName} is told when you write, and everyone who visits can read it.`}
        </p>

        {!isMe && (
          <form onSubmit={submit} className="mt-4">
            <div className="mb-2 flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => start(s)}
                  className="min-h-9 rounded-full border border-[#E7CDD3] bg-white px-3 text-xs font-semibold text-[#87102C] transition-colors hover:border-[#87102C] dark:border-white/[0.14] dark:bg-white/[0.04] dark:text-[#FFB3C1]"
                >
                  {s.trim()}…
                </button>
              ))}
            </div>
            <label htmlFor="kind-words-text" className="sr-only">
              Write something nice about {firstName}
            </label>
            <textarea
              id="kind-words-text"
              ref={box}
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX));
                setPosted(false);
              }}
              rows={3}
              placeholder={`What do you appreciate about ${firstName}?`}
              className="w-full resize-none rounded-2xl border border-[#E7CDD3] bg-white px-4 py-3 font-serif text-[15px] leading-relaxed text-[#111] shadow-sm focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-[#8a7e80] dark:text-white/40" aria-live="polite">
                {posted ? `Thank you. ${firstName} will be glad to read it.` : `${text.length}/${MAX}`}
              </span>
              <button
                type="submit"
                disabled={!text.trim() || add.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#87102C] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(135,16,44,0.3)] transition-all hover:bg-[#6E0C24] disabled:opacity-50 disabled:shadow-none"
              >
                {add.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
                Post
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </form>
        )}
      </div>

      <div className="px-5 py-5 sm:px-7">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
            <div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          </div>
        ) : total === 0 ? (
          <p className="py-4 text-center text-sm text-[#8a7e80] dark:text-white/45">
            {isMe ? "Nothing yet. When members write something nice about you, it appears here." : `Be the first to write something nice about ${firstName}.`}
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data!.items.map((c) => {
                const canRemove = isStaff || isMe || (viewerId != null && viewerId === c.author.id);
                return (
                  <li
                    key={c.id}
                    className="group relative flex flex-col rounded-2xl border border-[#E7CDD3]/70 bg-white p-5 shadow-[0_2px_16px_rgba(135,16,44,0.05)] dark:border-white/[0.08] dark:bg-white/[0.03]"
                  >
                    <Quote size={28} className="text-[#87102C]/25 dark:text-[#FFB3C1]/25" aria-hidden="true" fill="currentColor" />
                    <blockquote className="mt-1 flex-1 whitespace-pre-line break-words font-serif text-[15px] leading-relaxed text-[#2b2325] dark:text-white/85">
                      {c.body}
                    </blockquote>
                    <div className="mt-4 flex items-center gap-3 border-t border-[#E7CDD3]/50 pt-3 dark:border-white/[0.06]">
                      <Link href={`/dashboard/family/${c.author.id}`} aria-label={c.author.name}>
                        <Avatar person={c.author} size={36} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/dashboard/family/${c.author.id}`} className="block truncate text-sm font-bold text-[#111] hover:underline dark:text-white">
                          {c.author.name}
                        </Link>
                        <p className="text-xs text-[#8a7e80] dark:text-white/40">{when(c.createdAt)}</p>
                      </div>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => setRemoving(c.id)}
                          aria-label={`Remove what ${c.author.name} wrote`}
                          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[#8a7e80] hover:bg-[#FFF4F6] hover:text-red-600 dark:text-white/40 dark:hover:bg-white/10"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5">
              <Pagination page={page} pages={pages} onChange={setPage} label="Kind words pages" />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={removing != null}
        tone="danger"
        title="Remove these kind words?"
        description="They will be removed from the profile for everyone."
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
