"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Facebook, Link2, Linkedin, Share, Twitter } from "lucide-react";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.6.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1.1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8ZM12 0a12 12 0 0 0-10.3 18L0 24l6.2-1.6A12 12 0 1 0 12 0Z" />
    </svg>
  );
}

/**
 * The share button in an article's action bar: copy the link first, then
 * WhatsApp, X, Facebook and LinkedIn. Every link is the public page, which
 * anyone can open without signing in.
 */
export default function ShareMenu({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const enc = encodeURIComponent;
  const text = `${title} — Everlasting Hills Church`;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  const item = "m-ink flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm hover:bg-[var(--m-line)]";
  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Share" onClick={() => setOpen((v) => !v)} className="m-icon-btn">
        <Share size={19} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="m-paper absolute right-0 z-30 mt-1 w-60 border m-rule py-2">
          <button type="button" role="menuitem" onClick={copy} className={item}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
            {copied ? "Link copied" : "Copy link"}
          </button>
          <a role="menuitem" className={item} href={`https://wa.me/?text=${enc(`${text}\n${url}`)}`} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon /> Share on WhatsApp
          </a>
          <a role="menuitem" className={item} href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
            <Twitter size={16} aria-hidden="true" /> Share on X
          </a>
          <a role="menuitem" className={item} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">
            <Facebook size={16} aria-hidden="true" /> Share on Facebook
          </a>
          <a role="menuitem" className={item} href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
            <Linkedin size={16} aria-hidden="true" /> Share on LinkedIn
          </a>
        </div>
      )}
    </div>
  );
}
