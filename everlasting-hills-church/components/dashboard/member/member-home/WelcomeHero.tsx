"use client";

import { useState } from "react";
import { TrendingUp, Zap, Clock, QrCode } from "lucide-react";
import type { MemberHomeProps, StreakState } from "./types";
import { getGreeting, getServiceCountdown } from "./helpers";
import { QRModal } from "./QRModal";

export function WelcomeHero({ firstName, initials, photoUrl, memberDisplayId, attendanceRate, streak, nextService }: {
  firstName: string;
  initials: string;
  photoUrl: string | null;
  memberDisplayId: string;
  attendanceRate: number;
  streak: StreakState;
  nextService: MemberHomeProps["nextService"];
}) {
  const [showQR, setShowQR] = useState(false);
  const date = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
    >
      {/* Glow blobs */}
      <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
      {/* Watermark */}
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none text-[80px] font-black leading-none tracking-tight text-white/[0.04]">
        EHC
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-7 sm:p-9">
        <div className="flex md:items-center flex-col md:flex-row gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl ring-2 ring-white/20 ring-offset-2 ring-offset-transparent overflow-hidden bg-white/10 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-white">{initials}</span>
              )}
            </div>
            <span className="absolute -bottom-1 md:-right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#87102C]" />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-[#FFB3C1] mb-1.5 hover:text-white transition-colors group"
              title="Tap to show QR code"
            > {date}
              <QrCode size={11} className="opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
            <h1 className="text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl">
              {getGreeting()}, {firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Welcome back to Everlasting Hills Church.
            </p>
          </div>
        </div>

        {/* Right: stat badges */}
        <div className="flex flex-wrap gap-2">
          {attendanceRate > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <TrendingUp size={14} aria-hidden="true" />
              {attendanceRate}% attendance
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
            <Zap size={14} aria-hidden="true" />
            Level {streak.level} · {streak.title}
          </span>
          {nextService && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <Clock size={14} aria-hidden="true" />
              {getServiceCountdown(nextService.scheduledAt)}
            </span>
          )}
        </div>
      </div>

      {showQR && (
        <QRModal memberDisplayId={memberDisplayId} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}
