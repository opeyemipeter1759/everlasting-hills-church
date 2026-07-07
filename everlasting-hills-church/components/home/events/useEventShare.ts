"use client";

import { useState } from "react";
import type { EventSummary } from "@/types";
import { showToast } from "@/components/ui/toast/toast";

export function useEventShare(event: EventSummary, href: string, dateLabel: string) {
  const [copied, setCopied] = useState(false);
  const shareText = `Join me at ${event.title}${dateLabel ? ` on ${dateLabel}` : ""} — Everlasting Hills Church`;

  function buildUrl() {
    return typeof window !== "undefined" ? `${window.location.origin}${href}` : href;
  }

  // Tries to share the flier image + caption together via the OS share sheet
  // (so apps like WhatsApp receive both, same as a normal photo share).
  // Returns true once handled — either shared or the user cancelled — false
  // if the platform can't do a native share and the caller should fall back.
  async function shareNative(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    const url = buildUrl();
    const text = `${shareText}\n${url}`;
    try {
      if (event.flyerImageUrl && navigator.canShare) {
        const res = await fetch(event.flyerImageUrl);
        const blob = await res.blob();
        const file = new File([blob], `${event.slug}-flyer.jpg`, { type: blob.type || "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: event.title, text });
          return true;
        }
      }
      await navigator.share({ title: event.title, text, url });
      return true;
    } catch (err) {
      // user dismissed the share sheet — treat as handled, don't fall back
      return err instanceof Error && err.name === "AbortError";
    }
  }

  async function handleShareLink() {
    if (await shareNative()) return;
    try {
      await navigator.clipboard.writeText(buildUrl());
      setCopied(true);
      showToast.success("Registration link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error("Couldn't copy the link");
    }
  }

  async function handleWhatsApp() {
    if (await shareNative()) return;
    // wa.me can only prefill text — WhatsApp's URL scheme has no way to
    // attach an image, so this fallback is text + link only.
    const text = `${shareText}\n${buildUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return { copied, handleShareLink, handleWhatsApp };
}
