"use client";

import Image from "next/image";
import { BookMarked, Heart } from "lucide-react";
import {
  authorInitials,
  authorName,
  type ArticleAuthor,
} from "@/lib/api/articles";

/** "9 September", or "9 Sep 2025" once it is no longer this year. */
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: sameYear ? "long" : "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/**
 * An author's face, or their initials.
 *
 * Most members here have no photo, so the initials are the normal case rather
 * than the fallback and are styled to look deliberate.
 */
export function AuthorAvatar({
  author,
  size = 32,
}: {
  author: ArticleAuthor | null | undefined;
  size?: number;
}) {
  const photo = author?.Member?.photoUrl;

  if (photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={size}
        height={size}
        className="flex-shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 font-bold text-[#87102C] dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {authorInitials(author)}
    </span>
  );
}

export function Byline({
  author,
  publishedAt,
  readingMinutes,
  size = 28,
}: {
  author: ArticleAuthor | null | undefined;
  publishedAt: string | null;
  readingMinutes: number;
  size?: number;
}) {
  const date = formatDate(publishedAt);
  return (
    <div className="flex items-center gap-2.5">
      <AuthorAvatar author={author} size={size} />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-[#111] dark:text-white">
          {authorName(author)}
        </p>
        <p className="text-[11px] text-[#8a7e80] dark:text-white/40">
          {date && `${date} · `}
          {readingMinutes} min read
        </p>
      </div>
    </div>
  );
}

/** The passage a piece came from, shown as a quiet chip. */
export function ScriptureChip({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4F6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#87102C] dark:bg-[#87102C]/15 dark:text-[#FFB3C1]">
      <BookMarked size={10} /> {label}
    </span>
  );
}

export function LikeButton({
  liked,
  count,
  onToggle,
  disabled,
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={liked}
      aria-label={liked ? "Remove your like" : "Like this article"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-60 ${
        liked
          ? "border-[#87102C]/30 bg-[#FFF4F6] text-[#87102C] dark:border-[#FFB3C1]/30 dark:bg-[#87102C]/20 dark:text-[#FFB3C1]"
          : "border-gray-200 text-gray-500 hover:border-[#87102C]/30 hover:text-[#87102C] dark:border-white/10 dark:text-white/45 dark:hover:text-[#FFB3C1]"
      }`}
    >
      <Heart size={12} className={liked ? "fill-current" : ""} />
      {count > 0 ? count : "Like"}
    </button>
  );
}
