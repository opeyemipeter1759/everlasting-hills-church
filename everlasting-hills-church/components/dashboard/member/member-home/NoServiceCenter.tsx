"use client";

import { useState } from "react";
import Link from "next/link";
import { Youtube, BellRing, MessageCircle } from "lucide-react";
import { CHURCH } from "@/config/config";
import type { MemberHomeProps } from "./types";
import { fmtDate, fmtTime, getServiceCountdown } from "./helpers";

export function NoServiceCenter({ nextService }: { nextService: MemberHomeProps["nextService"] }) {
  const [reminded, setReminded] = useState(false);

  function handleSetReminder() {
    if (typeof window === "undefined" || !nextService) return;
    if (!("Notification" in window)) {
      setReminded(true); // graceful fallback
      return;
    }
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        const delay = new Date(nextService.scheduledAt).getTime() - Date.now() - 15 * 60 * 1000;
        if (delay > 0) {
          setTimeout(() => {
            new Notification("Service starts in 15 minutes", {
              body: `${nextService.name} — Hills Auditorium`,
              icon: "/favicon.ico",
            });
          }, delay);
        }
      }
      setReminded(true);
    });
  }

  if (nextService) {
    const countdown = getServiceCountdown(nextService.scheduledAt);
    return (
      <div className="text-center max-w-sm w-full">
        <p className="text-[#FFB3C1]/60 text-[10px] uppercase tracking-[0.3em] font-bold mb-2">
          Next Service In
        </p>
        <p className="text-white text-5xl font-black tracking-tight tabular-nums">{countdown}</p>
        <p className="text-white/60 text-sm font-semibold mt-2">{nextService.name}</p>
        <p className="text-white/35 text-xs mt-1 leading-relaxed">
          {fmtDate(nextService.scheduledAt, { weekday: "long", day: "numeric", month: "long" })}
          {" · "}{fmtTime(nextService.scheduledAt)} · Hills Auditorium
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <a
            href={CHURCH.youtubeUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#87102C]/30 transition-all"
          >
            <Youtube size={15} fill="currentColor" />
            Watch on YouTube
          </a>
          <button
            type="button"
            onClick={handleSetReminder}
            disabled={reminded}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:-translate-y-0.5 transition-all disabled:opacity-60"
          >
            <BellRing size={15} />
            {reminded ? "Reminder set ✓" : "Set reminder"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="text-center max-w-sm">
      <h3 className="text-white text-xl font-bold mb-2 tracking-tight">No Service Today</h3>
      <p className="text-white/55 text-sm mb-7 leading-relaxed">
        Stay connected through our platforms.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={CHURCH.youtubeUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] hover:-translate-y-0.5 transition-all"
        >
          <Youtube size={15} fill="currentColor" />
          Watch on YouTube
        </a>
        <Link
          href="/dashboard/prayer-requests"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-sm font-semibold hover:bg-white/15 hover:-translate-y-0.5 transition-all"
        >
          <MessageCircle size={15} />
          Prayer Wall
        </Link>
      </div>
    </div>
  );
}
