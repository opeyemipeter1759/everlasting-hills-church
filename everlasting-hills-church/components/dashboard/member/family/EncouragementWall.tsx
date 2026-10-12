"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Send, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  useAddProfileComment,
  useDeleteProfileComment,
  useProfileComments,
  type FamilyPerson,
} from "@/lib/api/family";
import { CardTitle, card } from "./ProfileSections";
import { Pagination } from "./Pagination";

const MAX = 500;

function Avatar({ person }: { person: FamilyPerson }) {
  const initials = person.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return person.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.photoUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] text-xs font-bold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
      {initials}
    </span>
  );
}

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

/**
 * Words of encouragement other members leave on a profile, like LinkedIn's
 * recommendations but for the church family. The owner reads them; they can
 * remove any, and a writer can remove their own.
 */
export default function EncouragementWall({
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
  const [removing, setRemoving] = useState<string | null>(null);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    try {
      await add.mutateAsync(text.trim());
      setText("");
      setPage(1);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Could not post that. Please try again.");
    }
  }

  return (
    <section id="encouragement" className={`${card} scroll-mt-24 p-5 sm:p-6`}>
      <CardTitle>Encouragement</CardTitle>

      {!isMe && (
        <form onSubmit={submit} className="mb-5">
          <label htmlFor="encourage-text" className="sr-only">
            Write a word of encouragement for {firstName}
          </label>
          <textarea
            id="encourage-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            rows={3}
            placeholder={`Write a word of encouragement for ${firstName}…`}
            className="w-full resize-none rounded-xl border border-[#E7CDD3]/60 bg-white px-4 py-3 text-sm text-[#111] focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-white"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-[#8a7e80] dark:text-white/40">
              {text.length}/{MAX} · {firstName} is told when you write
            </span>
            <button
              type="submit"
              disabled={!text.trim() || add.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#87102C] px-5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-60"
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

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
      ) : !data || data.total === 0 ? (
        <p className="text-sm text-[#8a7e80] dark:text-white/45">
          {isMe ? "When members encourage you, their words appear here." : `Be the first to encourage ${firstName}.`}
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {data.items.map((c) => {
              const canRemove = isStaff || isMe || (viewerId != null && viewerId === c.author.id);
              return (
                <li key={c.id} className="flex gap-3">
                  <Link href={`/dashboard/family/${c.author.id}`} aria-label={c.author.name}>
                    <Avatar person={c.author} />
                  </Link>
                  <div className="min-w-0 flex-1 rounded-2xl bg-[#FFF8F9] px-4 py-3 dark:bg-white/[0.04]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">
                        <Link href={`/dashboard/family/${c.author.id}`} className="font-bold text-[#111] hover:underline dark:text-white">
                          {c.author.name}
                        </Link>
                        <span className="ml-2 text-xs text-[#8a7e80] dark:text-white/40">{when(c.createdAt)}</span>
                      </p>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => setRemoving(c.id)}
                          aria-label={`Remove ${c.author.name}'s comment`}
                          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[#8a7e80] hover:bg-white hover:text-red-600 dark:text-white/40 dark:hover:bg-white/10"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-[#3d3436] dark:text-white/80">{c.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5">
            <Pagination page={page} pages={pages} onChange={setPage} label="Encouragement pages" />
          </div>
        </>
      )}

      <ConfirmDialog
        open={removing != null}
        tone="danger"
        title="Remove this comment?"
        description="It will be removed from the profile for everyone."
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
