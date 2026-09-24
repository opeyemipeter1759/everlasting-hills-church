"use client";

import { Check, Share2 } from "lucide-react";
import { useBookShare, type ShareableBook } from "./useBookShare";

/**
 * Share control for a book.
 *
 * `icon` sits on top of a cover in the library grid — where the whole tile is
 * a <Link>, so the click must not also navigate. `button` is the labelled
 * version used in the reader header.
 */
export default function BookShareButton({
  book,
  variant = "icon",
  className = "",
}: {
  book: ShareableBook;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { copied, handleShare } = useBookShare(book);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    void handleShare();
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Share ${book.title}`}
        title="Share"
        className={`absolute right-1.5 top-1.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
      >
        {copied ? <Check size={14} /> : <Share2 size={14} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 ${className}`}
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
