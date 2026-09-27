"use client";

import { useEffect, useRef, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Check, ChevronDown, Copy, ExternalLink, Megaphone, RefreshCw, Send, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EvangelismSummary } from "@/lib/api/evangelism";
import { showToast } from "@/components/ui/toast/toast";

function formUrl(): string {
  return typeof window === "undefined" ? "/evangelism/form" : `${window.location.origin}/evangelism/form`;
}

/**
 * The page title band: who this is for on the left, the two things you do from
 * anywhere on the page — hand out the outreach form, refresh — on the right.
 */
export function EvangelismHeader({ summary }: { summary: UseQueryResult<EvangelismSummary> }) {
  return (
    // Not overflow-hidden: the outreach form menu drops out below the band.
    // Only the glow is clipped, in its own layer.
    <header className="relative z-30 rounded-2xl bg-gradient-to-br from-[#87102C] via-[#8f1231] to-[#5E0A1E] px-5 py-5 text-white shadow-lg shadow-[#87102C]/15 sm:px-7 sm:py-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20 sm:flex">
            <Megaphone size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/60">Growth &amp; Outreach</p>
            <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl">Evangelism Team</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void summary.refetch()}
            aria-label="Refresh"
            title="Refresh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
          >
            <RefreshCw size={16} className={summary.isFetching ? "animate-spin" : ""} aria-hidden="true" />
          </button>
          <ShareFormMenu />
        </div>
      </div>
    </header>
  );
}

function ShareFormMenu() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(formUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error("Couldn't copy — the link is /evangelism/form");
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Evangelism form — record everyone you preach to:\n${formUrl()}`)}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-[#87102C] shadow-sm transition-colors hover:bg-white/90"
      >
        <Share2 size={15} aria-hidden="true" />
        <span className="hidden xs:inline">Outreach form</span>
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 text-gray-800 shadow-xl dark:border-white/10 dark:bg-[#1c1c1e] dark:text-white/85"
        >
          <p className="px-3 pb-2 pt-2 text-xs text-gray-500 dark:text-white/50">
            The public form the team fills in during outreach — no sign-in needed.
          </p>
          <MenuItem icon={copied ? Check : Copy} label={copied ? "Link copied" : "Copy link"} onClick={copy} />
          <MenuItem icon={Send} label="Share on WhatsApp" href={whatsapp} />
          <MenuItem icon={ExternalLink} label="Open the form" href="/evangelism/form" />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, href }: { icon: LucideIcon; label: string; onClick?: () => void; href?: string }) {
  const cls =
    "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10";
  const content = (
    <>
      <Icon size={16} className="text-gray-400" aria-hidden="true" /> {label}
    </>
  );
  return href ? (
    <a role="menuitem" href={href} target="_blank" rel="noreferrer" className={cls}>
      {content}
    </a>
  ) : (
    <button role="menuitem" type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}
