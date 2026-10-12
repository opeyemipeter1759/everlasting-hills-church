"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Heart, MessageCircle, Sparkles } from "lucide-react";
import { compact, initialsOf, storyDate, type Story } from "./story";

/** Round, the one thing besides buttons that is not square. */
export function MAvatar({ name, photoUrl, size = 24 }: { name: string; photoUrl: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.38) };
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt="" style={style} className="flex-shrink-0 rounded-full object-cover" />
  ) : (
    <span style={style} className="m-paper m-ink flex flex-shrink-0 items-center justify-center rounded-full border m-rule font-semibold">
      {initialsOf(name)}
    </span>
  );
}

/** Underlined tabs, Medium's "For you · Featured · Saved". */
export function MTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-7 overflow-x-auto border-b m-rule no-scrollbar">
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={`-mb-px min-h-11 whitespace-nowrap border-b pb-3 pt-1 text-sm transition-colors ${
              on ? "m-ink border-[var(--m-ink)]" : "m-muted border-transparent hover:text-[var(--m-ink)]"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * One article in a list: who wrote it and when, the title and subtitle, the
 * picture on the right, and the counts underneath. Text first, as Medium does.
 */
export function StoryRow({
  story,
  href,
  authorHref,
  onLike,
  onBookmark,
  busy = false,
}: {
  story: Story;
  href: string;
  authorHref?: string | null;
  onLike?: () => void;
  onBookmark?: () => void;
  busy?: boolean;
}) {
  return (
    <article className="border-b m-rule py-8 first:pt-4">
      <div className="flex items-center gap-2 text-[13px]">
        <MAvatar name={story.author.name} photoUrl={story.author.photoUrl} size={22} />
        {authorHref ? (
          <Link href={authorHref} className="m-ink m-link">
            {story.author.name}
          </Link>
        ) : (
          <span className="m-ink">{story.author.name}</span>
        )}
        {story.scriptureLabel && (
          <>
            <span className="m-muted" aria-hidden="true">
              in
            </span>
            <span className="m-ink truncate">{story.scriptureLabel}</span>
          </>
        )}
      </div>

      <Link href={href} className="group mt-3 flex items-start gap-6 sm:gap-12">
        <div className="min-w-0 flex-1">
          <h2 className="m-ink text-xl font-bold leading-snug tracking-[-0.016em] sm:text-[22px]">{story.title}</h2>
          {story.subtitle && <p className="m-muted mt-2 line-clamp-2 text-[15px] leading-snug sm:text-base">{story.subtitle}</p>}
        </div>
        {story.coverImageUrl && (
          // Square corners, as every image in the reading room.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.coverImageUrl} alt="" className="h-14 w-20 flex-shrink-0 object-cover sm:h-[107px] sm:w-40" />
        )}
      </Link>

      <div className="mt-4 flex items-center justify-between gap-3 sm:pr-52">
        <div className="m-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          {story.featured && (
            <span className="inline-flex items-center gap-1" title="Featured by the pastors">
              <Sparkles size={14} aria-hidden="true" className="text-[#C9A227]" />
              <span className="sr-only">Featured</span>
            </span>
          )}
          <span>{storyDate(story.publishedAt)}</span>
          <span>{story.readingMinutes} min read</span>
          {onLike ? (
            <button
              type="button"
              onClick={onLike}
              disabled={busy}
              aria-pressed={!!story.likedByMe}
              aria-label={story.likedByMe ? "Unlike" : "Like"}
              className="inline-flex min-h-9 items-center gap-1 hover:text-[var(--m-ink)]"
            >
              <Heart size={15} aria-hidden="true" fill={story.likedByMe ? "currentColor" : "none"} /> {compact(story.likeCount)}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Heart size={15} aria-hidden="true" /> {compact(story.likeCount)}
            </span>
          )}
          <Link href={`${href}#comments`} className="inline-flex min-h-9 items-center gap-1 hover:text-[var(--m-ink)]" aria-label={`${story.commentCount} responses`}>
            <MessageCircle size={15} aria-hidden="true" /> {compact(story.commentCount)}
          </Link>
        </div>
        {onBookmark && (
          <button
            type="button"
            onClick={onBookmark}
            disabled={busy}
            aria-pressed={!!story.bookmarkedByMe}
            aria-label={story.bookmarkedByMe ? "Remove from saved" : "Save for later"}
            className="m-icon-btn"
          >
            {story.bookmarkedByMe ? <BookmarkCheck size={19} aria-hidden="true" /> : <Bookmark size={19} aria-hidden="true" />}
          </button>
        )}
      </div>
    </article>
  );
}

/** Pastors' picks down the side, small and textual. */
/** basePath is a string, not a function, so a server page can render this client component. */
export function StaffPicks({ stories, basePath, title = "Staff Picks" }: { stories: Story[]; basePath: string; title?: string }) {
  if (stories.length === 0) return null;
  return (
    <section aria-labelledby="staff-picks">
      <h2 id="staff-picks" className="m-ink text-base font-bold">
        {title}
      </h2>
      <ul className="mt-4 space-y-5">
        {stories.slice(0, 4).map((s) => (
          <li key={s.id}>
            <div className="flex items-center gap-2 text-[13px]">
              <MAvatar name={s.author.name} photoUrl={s.author.photoUrl} size={20} />
              <span className="m-ink">{s.author.name}</span>
            </div>
            <Link href={`${basePath}/${s.slug}`} className="m-ink mt-1.5 block text-base font-bold leading-snug hover:underline">
              {s.title}
            </Link>
            <p className="m-muted mt-1 text-[13px]">{storyDate(s.publishedAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Just start writing": the invitation on the side of the feed. */
export function WriteCard({ href, signedIn = true }: { href: string; signedIn?: boolean }) {
  return (
    <section className="m-paper border m-rule">
      <div className="m-canvas border-b m-rule p-5">
        <Link href={href} className="m-paper m-muted m-serif flex items-center gap-3 border m-rule px-4 py-3 text-lg italic hover:text-[var(--m-ink)]">
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full border m-rule not-italic">
            +
          </span>
          Just start writing
        </Link>
      </div>
      <div className="p-5">
        <h2 className="m-ink text-lg font-bold leading-snug">Write for the church family</h2>
        <p className="m-muted mt-2 text-sm leading-relaxed">
          Share what God is teaching you. A pastor or the comms team reads it first, then it goes out to the church and the public blog.
        </p>
        <Link href={href} className="m-pill mt-4">
          {signedIn ? "Write a story" : "Sign in to write"}
        </Link>
      </div>
    </section>
  );
}
