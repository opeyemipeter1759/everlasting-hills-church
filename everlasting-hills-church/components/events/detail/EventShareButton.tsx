"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { showToast } from "@/components/ui/toast/toast";
import type { EventDetail } from "@/types";
import { formatEventDateRange } from "./event-format";

export default function EventShareButton({ event }: { event: EventDetail }) {
  const [copied, setCopied] = useState(false);
  const schedule = event.Schedules.map((item) => formatClock(item.startTime)).join(" & ");
  const title = `${event.title}${event.theme ? ` — ${event.theme}` : ""}`;
  const text = [title, "Everlasting Hills Church", formatEventDateRange(event.startAt, event.endAt, event.timezone), schedule ? `${schedule}${event.timezone === "Africa/Lagos" ? " WAT" : ""}` : ""].filter(Boolean).join("\n");

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast.success("Event link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      showToast.error("Couldn’t share this event");
    }
  }

  return <button type="button" onClick={share} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-bold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">{copied ? <Check size={16} /> : <Share2 size={16} />} Share event</button>;
}

function formatClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
