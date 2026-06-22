"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Hand, CheckCircle2, Youtube, MessageCircle, ChevronRight } from "lucide-react";
import { CHURCH } from "@/config/config";
import { useCanMark, useCheckIn } from "@/lib/api";
import type { MemberHomeProps } from "@/types";


function CosmicBackdrop() {
  const dots = [
    { top: "12%", left: "50%", size: 5, color: "#FFB3C1", delay: 0 },
    { top: "32%", left: "22%", size: 4, color: "#ffffff", delay: 0.8 },
    { top: "28%", left: "78%", size: 4, color: "#FFB3C1", delay: 1.6 },
    { top: "62%", left: "12%", size: 3, color: "#ffffff", delay: 0.4 },
    { top: "70%", left: "88%", size: 4, color: "#FFB3C1", delay: 1.1 },
    { top: "85%", left: "30%", size: 3, color: "#ffffff", delay: 0.6 },
    { top: "90%", left: "65%", size: 5, color: "#FFB3C1", delay: 1.9 },
  ];
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#87102C]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-16 w-72 h-72 rounded-full bg-amber-300/8 blur-3xl pointer-events-none" />
      {dots.map((d, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            background: d.color,
            boxShadow: `0 0 ${d.size * 2.5}px ${d.color}`,
          }}
          animate={{ opacity: [0.25, 0.95, 0.25] }}
          transition={{ duration: 3.4, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function ServiceDayCenter({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center gap-7">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-label="Check in for today's service"
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0e0407] rounded-full disabled:cursor-not-allowed group"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        {[0, 0.8, 1.6].map((delay, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#87102C]"
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
        <motion.span
          className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#a32242] via-[#87102C] to-[#5d091f] shadow-[0_20px_60px_rgba(135,16,44,0.55)] border border-white/10"
          animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-1 rounded-full bg-gradient-to-br from-white/15 to-transparent pointer-events-none"
          />
          {loading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="w-9 h-9 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <motion.span
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
            >
              <Hand size={40} className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
            </motion.span>
          )}
        </motion.span>
      </motion.button>
      <div className="text-center max-w-xs">
        <p className="text-white text-lg font-bold tracking-tight">
          {loading ? "Marking your presence…" : "Tap the hand to check in"}
        </p>
        <p className="text-white/55 text-xs mt-1.5 leading-relaxed">
          One gesture is all it takes. God&apos;s house, marked with your name.
        </p>
      </div>
    </div>
  );
}

function NoServiceCenter() {
  return (
    <div className="text-center max-w-sm">
      <h3 className="text-white text-xl font-bold mb-2 tracking-tight">No Service Today</h3>
      <p className="text-white/55 text-sm mb-7 leading-relaxed">
        No service is scheduled. Stay connected through our platforms.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={CHURCH.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#87102C]/30 transition-all"
        >
          <Youtube size={15} fill="currentColor" className="text-white" />
          Watch on YouTube
          <ChevronRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </a>
        <a
          href="/prayer-request"
          className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:-translate-y-0.5 transition-all"
        >
          <MessageCircle size={15} />
          Prayer Wall
          <ChevronRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}

function CheckedInCenter() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.45 }}
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400/25 to-emerald-600/25 border border-emerald-300/40 flex items-center justify-center"
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-emerald-400/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
        />
        <CheckCircle2 size={42} className="text-emerald-300 relative" strokeWidth={2.2} />
      </motion.div>
      <div>
        <p className="text-white text-xl font-bold tracking-tight">You&apos;re in.</p>
        <p className="text-white/55 text-xs mt-1.5">God bless you — see you in service.</p>
      </div>
    </div>
  );
}

export function CheckInPanel({
  todayService, hasCheckedInToday,
}: { todayService: MemberHomeProps["todayService"]; hasCheckedInToday: boolean }) {
  const { data: canMarkData, isLoading: canMarkLoading } = useCanMark();
  const checkIn = useCheckIn();
  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday);
  const [error, setError] = useState("");

  async function handleCheckIn() {
    setError("");
    try {
      await checkIn.mutateAsync();
      setCheckedIn(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Check-in failed. Please try again.");
    }
  }

  const canMark = canMarkData?.canMark === true;
  const serviceName = todayService?.name ?? "Everlasting Hills";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] border border-white/8 min-h-[440px] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <CosmicBackdrop />
      <div className="relative z-10 flex flex-col h-full p-7 sm:p-8">
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FFB3C1]/80">
            Today&apos;s Service
          </p>
          <h2 className="text-white text-xl sm:text-2xl font-bold mt-1.5">{serviceName}.</h2>
          <div className="h-px w-12 bg-white/20 mt-3" />
        </div>
        <div className="flex-1 flex items-center justify-center py-6">
          {canMarkLoading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full"
            />
          ) : checkedIn || canMarkData?.reason === 'ALREADY_MARKED' ? (
            <CheckedInCenter />
          ) : canMark ? (
            <ServiceDayCenter onClick={handleCheckIn} loading={checkIn.isPending} />
          ) : (
            <NoServiceCenter />
          )}
        </div>
        {error && (
          <p className="relative z-10 text-center text-xs text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
