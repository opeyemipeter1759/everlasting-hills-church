"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { ReadingPlanSummary } from "@/lib/api/reading-plan";
import { planShareLink } from "@/lib/reading-plan-link";

type SharablePlan = Pick<ReadingPlanSummary, "slug" | "title" | "subtitle">;

/** A phone, where the share sheet reaches WhatsApp, texts and email directly. */
function hasShareSheet(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends a plan as a link. On a phone it opens the share sheet, so the link
 * goes straight to WhatsApp, a text or an email; on a computer it copies the
 * link to paste anywhere. The link opens the plan ready to start, and someone
 * signed out is brought back to it after logging in.
 */
export function SharePlanLinkButton({ plan, className = "" }: { plan: SharablePlan; className?: string }) {
  async function send() {
    const url = planShareLink(plan.slug);
    if (hasShareSheet()) {
      try {
        await navigator.share({
          title: plan.title,
          text: plan.subtitle ? `${plan.title}: ${plan.subtitle}` : plan.title,
          url,
        });
        return;
      } catch (cause) {
        // Closing the share sheet is a choice, not a failure.
        if ((cause as { name?: unknown } | null)?.name === "AbortError") return;
      }
    }
    if (await copy(url)) showToast.success("Link copied. Paste it into WhatsApp, a text or an email.");
    else showToast.error("Could not copy the link. Open the plan and copy the address from your browser.");
  }

  return (
    <button
      type="button"
      onClick={send}
      aria-label={`Send a link to ${plan.title}`}
      title="Send a link to this plan"
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${className}`}
    >
      <Share2 size={17} aria-hidden="true" />
    </button>
  );
}

/** The plan's link, shown in full with a copy button, for posting in a group chat. */
export function PlanLinkField({ plan }: { plan: SharablePlan }) {
  const [copied, setCopied] = useState(false);
  const url = planShareLink(plan.slug);

  async function copyLink() {
    if (await copy(url)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } else {
      showToast.error("Could not copy the link. Select it and copy it instead.");
    }
  }

  return (
    <div className="text-sm font-semibold text-gray-700 dark:text-white/75">
      <label htmlFor={`plan-link-${plan.slug}`}>Plan link</label>
      <div className="mt-1.5 flex min-w-0 gap-2">
        <input
          id={`plan-link-${plan.slug}`}
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-normal text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
        />
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/75 dark:hover:bg-white/5"
        >
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="mt-1 text-xs font-normal text-gray-500 dark:text-white/50">
        Anyone in the church can open it, even after signing in first.
      </p>
    </div>
  );
}
