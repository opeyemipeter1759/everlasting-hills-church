"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Sparkles, ArrowRight, Clock } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { getFrontendSessionUser, type FrontendSessionUser } from "@/lib/auth/frontend-session";

/**
 * Public-homepage attendance widget.
 *
 * Two visual states by auth:
 *   - Authenticated → fetches today's service + check-in status, big CTA button to mark
 *                     attendance. Success animation. Already-checked-in state.
 *   - Anonymous     → "loud and calling" empty state inviting sign-in / first-timer flow.
 *
 * Why this lives client-side: it reacts to cookies (cookies aren't available on the server
 * for the public layout) AND it mutates state on click (check-in). Server Component + form
 * action would be cleaner architecturally but adds friction here.
 */

interface NextServiceResponse {
  id: string;
  name: string;
  scheduledAt: string;
}

interface CheckInResponse {
  alreadyCheckedIn: boolean;
  service: { id: string; name: string; scheduledAt: string };
}

interface MyAttendanceRecord {
  serviceId: string;
}

function fmtServiceTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function AttendanceSection() {
  const [session, setSession] = useState<FrontendSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<NextServiceResponse | null>(null);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getFrontendSessionUser();
    setSession(s);

    if (!s?.loggedIn) {
      setLoading(false);
      return;
    }

    // Parallel: next service + my attendance history (to know if today's service is checked-in)
    (async () => {
      try {
        const [nextRes, mineRes] = await Promise.all([
          apiClient.get<NextServiceResponse>("/attendance/services/next"),
          apiClient.get<MyAttendanceRecord[]>("/attendance/me"),
        ]);
        setNext(nextRes.data);
        if (nextRes.data && isToday(nextRes.data.scheduledAt)) {
          const recs = mineRes.data ?? [];
          setCheckedInToday(recs.some((r) => r.serviceId === nextRes.data.id));
        }
      } catch (err) {
        // Soft-degrade — empty state. Don't blow up the homepage on a backend hiccup.
        const msg = (err as { message?: string }).message;
        setError(msg ?? "Couldn't load service info");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCheckIn() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post<CheckInResponse>("/attendance/check-in");
      setCheckedInToday(true);
      if (!res.data.alreadyCheckedIn) setJustCheckedIn(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Skeleton (initial paint) ──────────────────────────────────────────────
  if (loading) {
    return (
      <section className="relative py-20 px-5 sm:px-8 bg-gradient-to-br from-[#87102C] via-[#6E0C24] to-[#4a081a] text-white overflow-hidden">
        <div className="max-w-[1100px] mx-auto">
          <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse" />
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  // ── Anonymous: loud invitation ────────────────────────────────────────────
  if (!session?.isLoggedIn) {
    return (
      <section className="relative py-20 sm:py-24 px-5 sm:px-8 bg-gradient-to-br from-[#87102C] via-[#6E0C24] to-[#4a081a] text-white overflow-hidden">
        {/* Decorative bg orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-[1100px] mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300 mb-4">
              <Sparkles size={14} />
              Sunday Service
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
              Walk in. Check in. Be counted.
            </h2>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              Members can check in for service in two taps. Track your attendance, build your
              streak, and stay connected to the Hills family.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#87102C] font-bold text-sm hover:bg-amber-50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Sign in to check in
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/first-timer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                First time? Start here
              </Link>
            </div>
          </div>

          {/* Right: visual empty-state card */}
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-8">
              <div className="flex items-center gap-3 text-amber-300 mb-3">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Live Sundays · Hills Auditorium
                </span>
              </div>
              <p className="text-white/95 font-semibold text-lg mb-2">
                Service starts at 9:00 AM
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Sign in to track your weekly attendance, see your streak, and check in from
                the door or your seat.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-white/40">
                <Clock size={12} />
                Member sign-in opens 30 minutes before service
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  const firstName = session.fullName?.split(" ")[0] ?? session.email?.split("@")[0] ?? "friend";
  const todayAvailable = next && isToday(next.scheduledAt);

  return (
    <section className="relative py-20 sm:py-24 px-5 sm:px-8 bg-gradient-to-br from-[#87102C] via-[#6E0C24] to-[#4a081a] text-white overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-[1100px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300 mb-3">
              <Sparkles size={14} />
              Welcome back, {firstName}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Mark your presence.
            </h2>
          </div>
        </div>

        {/* Check-in card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-7 sm:p-9"
        >
          {next ? (
            <>
              <div className="flex items-center gap-3 text-amber-300 mb-3">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {todayAvailable ? "Today's Service" : "Next Service"}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-1">{next.name}</h3>
              <p className="text-white/70 mb-7">{fmtServiceTime(next.scheduledAt)}</p>

              {checkedInToday ? (
                <motion.div
                  initial={justCheckedIn ? { scale: 0.95, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100"
                >
                  <CheckCircle2 size={22} className="text-emerald-300" />
                  <div>
                    <p className="font-bold">You're checked in today.</p>
                    <p className="text-xs text-emerald-200/80">
                      God bless you — see you in service!
                    </p>
                  </div>
                </motion.div>
              ) : todayAvailable ? (
                <div>
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={submitting}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-[#87102C] font-bold text-base hover:bg-amber-50 transition-all hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-[#87102C]/30 border-t-[#87102C] rounded-full animate-spin" />
                        Checking you in…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Check me in
                      </>
                    )}
                  </button>
                  {error && (
                    <p className="mt-3 text-sm text-red-200 bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2 inline-block">
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white/70">
                  <Clock size={18} />
                  <div>
                    <p className="font-semibold text-white/90">Check-in opens on service day.</p>
                    <p className="text-xs text-white/60">
                      Come back {new Date(next.scheduledAt).toLocaleDateString("en-GB", { weekday: "long" })}.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 text-white/70">
              <Calendar size={18} />
              <div>
                <p className="font-semibold text-white/90">No upcoming service scheduled.</p>
                <p className="text-xs text-white/60">
                  Check back soon — our team is finalizing the calendar.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <p className="mt-6 text-center text-xs text-white/60">
          Already checked in?{" "}
          <Link href="/dashboard" className="text-amber-300 font-semibold hover:text-amber-200">
            View your attendance streak →
          </Link>
        </p>
      </div>
    </section>
  );
}
