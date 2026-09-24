"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/toast/toast";
import type { Book } from "@/lib/api/books";

/** What the share sheet needs — a full Book works, so does a library card row. */
export type ShareableBook = Pick<Book, "id" | "title"> &
  Partial<Pick<Book, "author" | "coverUrl">>;

export function bookShareHref(id: string) {
  return `/dashboard/books/${id}`;
}

/**
 * Sharing one book out of the church library.
 *
 * Mirrors the event share (`components/home/events/useEventShare`): the OS
 * share sheet first — with the cover attached where the platform allows files,
 * so WhatsApp receives the picture and the caption together — and a clipboard
 * copy for desktop browsers that have no share sheet.
 */
export function useBookShare(book: ShareableBook) {
  const [copied, setCopied] = useState(false);
  const byline = book.author ? ` by ${book.author}` : "";
  const shareText = `Reading "${book.title}"${byline} in the Everlasting Hills Church library`;

  function buildUrl() {
    const href = bookShareHref(book.id);
    return typeof window !== "undefined" ? `${window.location.origin}${href}` : href;
  }

  // Returns true once handled — shared, or the sheet was dismissed. False means
  // the platform has no share sheet and the caller should fall back.
  async function shareNative(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    const url = buildUrl();
    const text = `${shareText}\n${url}`;
    try {
      if (book.coverUrl && navigator.canShare) {
        try {
          const res = await fetch(book.coverUrl);
          const blob = await res.blob();
          const file = new File([blob], `${book.id}-cover.jpg`, { type: blob.type || "image/jpeg" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: book.title, text });
            return true;
          }
        } catch {
          // Cover fetch can fail on a CORS-less bucket — fall through to
          // text + link rather than losing the share entirely.
        }
      }
      await navigator.share({ title: book.title, text, url });
      return true;
    } catch (err) {
      return err instanceof Error && err.name === "AbortError";
    }
  }

  async function handleShare() {
    if (await shareNative()) return;
    try {
      await navigator.clipboard.writeText(`${shareText}\n${buildUrl()}`);
      setCopied(true);
      showToast.success("Book link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error("Couldn't copy the link");
    }
  }

  async function handleWhatsApp() {
    if (await shareNative()) return;
    // wa.me can only prefill text — its URL scheme can't carry an image.
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${buildUrl()}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return { copied, shareText, buildUrl, handleShare, handleWhatsApp };
}
