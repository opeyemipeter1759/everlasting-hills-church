"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Hand,
  MessageCircle,
  Sparkles,
  Youtube,
} from "lucide-react";
import { CHURCH } from "@/config/config";
import { getFrontendSessionUser, type FrontendSessionUser } from "@/lib/auth/frontend-session";
import { useCanMark, useCheckIn } from "@/lib/api";

export default function AttendanceSection() {
  const [session, setSession] = useState<FrontendSessionUser | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(getFrontendSessionUser());
    setSessionReady(true);
  }, []);

  const isLoggedIn = !!session?.loggedIn;

  const { data: canMarkData, isLoading: canMarkLoading } = useCanMark({ enabled: isLoggedIn });
  const checkIn = useCheckIn();

  async function handleCheckIn() {
    setError(null);
    try {
      await checkIn.mutateAsync();
      setCheckedIn(true);
      setJustCheckedIn(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Check-in failed. Please try again.");
    }
  }

  const canMark = isLoggedIn && canMarkData?.canMark === true;
  const alreadyMarked = isLoggedIn && (checkedIn || canMarkData?.reason === "ALREADY_MARKED");
  const firstName = session ? firstNameOf(session) : "friend";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!sessionReady || (isLoggedIn && canMarkLoading)) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] text-white py-24 sm:py-28 px-5 sm:px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse" />
          <div className="h-72 bg-white/5 rounded-3xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="attendance"
      className="relative overflow-hidden bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] text-white py-24 sm:py-28 px-5 sm:px-8"
    >
      <CosmicBackdrop />

      <div className="relative max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="mb-12 sm:mb-14">
          <p className="text-[11px] tracking-[0.3em] uppercase font-bold text-[#FFB3C1]/80 inline-flex items-center gap-2 mb-3">
            <Sparkles size={13} className="text-amber-300" />
            {isLoggedIn ? <>Welcome back, {firstName}</> : <>Today&apos;s Service</>}
          </p>
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight">
            {!isLoggedIn
              ? "Walk in. Check in. Be counted."
              : alreadyMarked
                ? "You're in. God bless you."
                : canMark
                  ? "Mark your presence."
                  : "Stay close even on quiet days."}
          </h2>
          <div className="h-px w-16 bg-white/20 mt-5" />
        </div>

        {/* Hero block */}
        <div className="relative">
          {!isLoggedIn ? (
            <AnonymousInvitation />
          ) : alreadyMarked ? (
            <CheckedInHero justCheckedIn={justCheckedIn} />
          ) : canMark ? (
            <ServiceDayHero onClick={handleCheckIn} loading={checkIn.isPending} error={error} />
          ) : (
            <NoServiceHero />
          )}
        </div>

        {/* Dashboard link */}
        {isLoggedIn && (
          <p className="mt-10 text-center text-xs text-white/55">
            Track your weekly streak in your{" "}
            <Link href="/dashboard" className="text-amber-300 font-semibold hover:text-amber-200 transition-colors">
              member dashboard →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

function firstNameOf(s: FrontendSessionUser): string {
  return s.fullName?.split(" ")[0] ?? s.email?.split("@")[0] ?? "friend";
}

/* ── Cosmic backdrop ─────────────────────────────────────────────────────── */
function CosmicBackdrop() {
  const dots = [
    { top: "8%", left: "22%", size: 4, color: "#FFB3C1", delay: 0 },
    { top: "16%", left: "78%", size: 5, color: "#ffffff", delay: 0.6 },
    { top: "28%", left: "12%", size: 3, color: "#FFB3C1", delay: 1.2 },
    { top: "34%", left: "88%", size: 4, color: "#FFB3C1", delay: 0.4 },
    { top: "48%", left: "6%", size: 5, color: "#ffffff", delay: 1.6 },
    { top: "55%", left: "94%", size: 3, color: "#FFB3C1", delay: 0.9 },
    { top: "68%", left: "20%", size: 4, color: "#ffffff", delay: 0.2 },
    { top: "72%", left: "82%", size: 5, color: "#FFB3C1", delay: 1.4 },
    { top: "84%", left: "10%", size: 3, color: "#FFB3C1", delay: 0.7 },
    { top: "88%", left: "55%", size: 4, color: "#ffffff", delay: 1.1 },
    { top: "92%", left: "90%", size: 3, color: "#FFB3C1", delay: 0.3 },
  ];
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-[#87102C]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-amber-300/8 blur-3xl pointer-events-none" />
      {dots.map((d, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: d.color, boxShadow: `0 0 ${d.size * 2.5}px ${d.color}` }}
          animate={{ opacity: [0.2, 0.95, 0.2] }}
          transition={{ duration: 3.6, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

/* ── Service-day hero ────────────────────────────────────────────────────── */
function ServiceDayHero({ onClick, loading, error }: { onClick: () => void; loading: boolean; error: string | null }) {
  return (
    <div className="flex flex-col items-center gap-9 py-6">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-label="Check in for today's service"
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0e0407] rounded-full disabled:cursor-not-allowed"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        {[0, 0.8, 1.6].map((delay, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#87102C]"
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
        <motion.span
          className="relative flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#a32242] via-[#87102C] to-[#5d091f] shadow-[0_24px_80px_rgba(135,16,44,0.55)] border border-white/10"
          animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span aria-hidden="true" className="absolute inset-1 rounded-full bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
          {loading ? (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <motion.span animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}>
              <Hand size={52} className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
            </motion.span>
          )}
        </motion.span>
      </motion.button>

      <div className="text-center max-w-sm">
        <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">
          {loading ? "Marking your presence…" : "Tap the hand to check in"}
        </p>
        <p className="text-white/55 text-sm mt-2 leading-relaxed">
          One gesture is all it takes. God&apos;s house, marked with your name.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-200 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── No-service hero ────────────────────────────────────────────────────── */
function NoServiceHero() {
  return (
    <div className="flex flex-col items-center gap-7 py-10 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center backdrop-blur-sm">
        <Clock size={22} className="text-[#FFB3C1]" />
      </div>
      <div>
        <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2 tracking-tight">No Service Today</h3>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed">
          No service is scheduled. Stay connected through our platforms.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <a
          href={CHURCH.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#87102C]/40 transition-all"
        >
          <Youtube size={15} fill="currentColor" />
          Watch on YouTube
          <ChevronRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </a>
        <Link
          href="/prayer-request"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/8 border border-white/15 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:-translate-y-0.5 transition-all"
        >
          <MessageCircle size={15} />
          Prayer Wall
          <ChevronRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

/* ── Checked-in hero ─────────────────────────────────────────────────────── */
function CheckedInHero({ justCheckedIn }: { justCheckedIn: boolean }) {
  return (
    <div className="flex flex-col items-center gap-7 py-8 text-center">
      <motion.div
        initial={justCheckedIn ? { scale: 0, rotate: -90 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.45 }}
        className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400/25 to-emerald-600/25 border border-emerald-300/40 flex items-center justify-center"
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-emerald-400/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
        />
        <CheckCircle2 size={52} className="text-emerald-300 relative" strokeWidth={2.2} />
      </motion.div>
      <div>
        <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">You&apos;re counted for today.</p>
        <p className="text-white/55 text-sm mt-2">See you in service.</p>
      </div>
    </div>
  );
}

/* ── Anonymous invitation ────────────────────────────────────────────────── */
function AnonymousInvitation() {
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
      <div>
        <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
          Members check in with a single tap. Track your attendance, build your streak,
          stay connected to the Hills family.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#87102C] font-bold text-sm hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-2xl transition-all"
          >
            Sign in to check in
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/first-timer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/8 hover:-translate-y-0.5 transition-all backdrop-blur-sm"
          >
            First time? Start here
          </Link>
        </div>
      </div>

      <div className="relative flex items-center justify-center py-8">
        <div className="relative">
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#87102C]/45"
            animate={{ scale: [1, 1.9, 1], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#a32242]/70 via-[#87102C]/70 to-[#5d091f]/70 border border-white/10 shadow-[0_20px_60px_rgba(135,16,44,0.45)] flex items-center justify-center"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hand size={48} className="text-white/85" />
          </motion.div>
        </div>
        <p className="absolute -bottom-1 text-[10px] tracking-[0.25em] uppercase font-bold text-white/40">
          Members only · sign in to enable
        </p>
      </div>
    </div>
  );
}
