"use client";

import { useEffect, useState } from "react";
import { Check, Facebook, Link2, Share2, Twitter } from "lucide-react";
import { publicArticleUrl } from "@/lib/api/blog";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.6.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1.1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8ZM12 0a12 12 0 0 0-10.3 18L0 24l6.2-1.6A12 12 0 1 0 12 0Z" />
    </svg>
  );
}

const button =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E7CDD3] bg-white px-4 text-sm font-semibold text-[#5A4A4D] transition-colors hover:border-[#87102C] hover:text-[#87102C] dark:border-white/[0.14] dark:bg-white/[0.04] dark:text-white/75";

/**
 * Share an article from the public blog: WhatsApp first (it is how Ibadan
 * shares), then Facebook and X, the phone's own share sheet, and a copy link.
 * Every link points at the public page, which anyone can open.
 */
export default function ShareArticle({ slug, title, compact = false }: { slug: string; title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  // Known only in the browser; checked after mounting so the server and browser render alike.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);
  const url = publicArticleUrl(slug);
  const text = `${title} — Everlasting Hills Church`;
  const enc = encodeURIComponent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the other buttons still work.
    }
  }
  async function native() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // Closed the share sheet.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share this article" role="group">
      {!compact && <span className="mr-1 text-sm font-semibold text-[#8a7e80] dark:text-white/45">Share</span>}
      <a href={`https://wa.me/?text=${enc(`${text}\n${url}`)}`} target="_blank" rel="noopener noreferrer" className={button} aria-label="Share on WhatsApp">
        <WhatsAppIcon /> {!compact && "WhatsApp"}
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer" className={button} aria-label="Share on Facebook">
        <Facebook size={16} aria-hidden="true" /> {!compact && "Facebook"}
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className={button} aria-label="Share on X">
        <Twitter size={16} aria-hidden="true" /> {!compact && "X"}
      </a>
      {canShare && (
        <button type="button" onClick={native} className={button} aria-label="More ways to share">
          <Share2 size={16} aria-hidden="true" />
        </button>
      )}
      <button type="button" onClick={copy} className={button}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
