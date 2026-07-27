"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/axios";
import { Loader2, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";
import Image from "next/image";

type VisitorType = "first" | "second" | "third";
type Phase = "select" | "email" | "done";

const CARDS: {
  id: VisitorType;
  num: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
}[] = [
  {
    id: "first",
    num: "01",
    title: "First Time Visitor",
    subtitle: "Welcome! Fill a quick form so we can get to know you.",
    badge: "New Here",
    badgeColor: "bg-church-accent/20 text-church-accent",
  },
  {
    id: "second",
    num: "02",
    title: "Second Time Visitor",
    subtitle: "Great to have you back. Just enter your email.",
    badge: "Returning",
    badgeColor: "bg-amber-400/15 text-amber-300",
  },
  {
    id: "third",
    num: "03",
    title: "I Have an Account",
    subtitle: "You're family! Log in to mark your attendance.",
    badge: "Member",
    badgeColor: "bg-emerald-400/15 text-emerald-300",
  },
];

export default function OnlineAttendancePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("select");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCardClick = (type: VisitorType) => {
    if (type === "first") { router.push("/first-timer"); return; }
    if (type === "second") { setPhase("email"); return; }
    router.push("/login");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || loading) return;
    setLoading(true);
    setError("");
    try {
      const { data: res } = await apiClient.post<{ action: string }>("/online-attendance/check-in", {
        email: email.trim().toLowerCase(),
      });
      if (res.action === "redirect_first_timer") {
        router.push("/first-timer");
        return;
      }
      setPhase("done");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-church-dark text-white relative overflow-x-hidden flex flex-col">
      {/* Background image layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/images/church_congregation_3_1779193624434.png"
          alt=""
          fill
          className="object-cover opacity-20 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-church-dark/70 via-church-dark/80 to-church-dark" />
        <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-transparent to-church-dark/50" />
        {/* Maroon glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-church-maroon/20 blur-[120px] rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-20">
        {/* Church mark */}
        <div className="mb-8 flex items-center gap-2.5 opacity-70">
          <Image src="/logo.png" alt="EHC" width={32} height={32} />
          <span className="text-white/60 text-xs font-semibold uppercase tracking-[0.3em]">Everlasting Hills</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-church-maroon/20 border border-church-maroon/30 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-church-accent animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-church-accent">
              Live Online · Check In
            </span>
          </div>
          <h1 className="text-white text-4xl sm:text-5xl font-bold leading-[1.15] mb-4">
            Good to have you<br />
            <em className="not-italic text-white/35 font-light font-serif">joining us online.</em>
          </h1>
          <p className="text-white/45 text-base leading-relaxed">
            Select how you're joining us today and we'll take care of the rest.
          </p>
        </div>

        {/* Phase: Cards */}
        {phase === "select" && (
          <div className="w-full max-w-md space-y-3">
            {CARDS.map((card, i) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                className="w-full group relative flex items-center gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm p-5 text-left
                  hover:bg-church-maroon/10 hover:border-church-maroon/50 hover:shadow-[0_0_40px_rgba(135,16,44,0.15)]
                  transition-all duration-300"
              >
                {/* Number */}
                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-church-maroon/20 group-hover:bg-church-maroon/35 transition-colors flex items-center justify-center">
                  <span className="text-church-accent font-black text-lg leading-none">{card.num}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold text-[15px]">{card.title}</span>
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-white/40 text-[13px] leading-snug">{card.subtitle}</p>
                </div>

                <ArrowRight
                  size={16}
                  className="text-white/20 flex-shrink-0 group-hover:text-church-accent group-hover:translate-x-1 transition-all duration-300"
                />
              </button>
            ))}

            <p className="text-center text-white/25 text-xs pt-4 pb-2">
              Not sure which to pick? Choose the one that best describes your visit.
            </p>
          </div>
        )}

        {/* Phase: Email input */}
        {phase === "email" && (
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-8 sm:p-10">
              <button
                type="button"
                onClick={() => { setPhase("select"); setError(""); setEmail(""); }}
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 mb-8 transition-colors"
              >
                <ChevronLeft size={14} />
                Back
              </button>

              <div className="mb-8">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center mb-4">
                  <span className="text-amber-300 font-black text-base">02</span>
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">Welcome back!</h2>
                <p className="text-white/45 text-sm leading-relaxed">
                  Enter your email and we'll look you up. If we don't have your details yet, we'll direct you to a quick form.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.35em] text-white/30 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3.5 text-sm text-white placeholder-white/20
                      focus:outline-none focus:ring-2 focus:ring-church-maroon/50 focus:border-church-maroon/40 transition-all"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!email.includes("@") || loading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-church-maroon py-4 text-sm font-bold tracking-wide text-white
                    hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-church-maroon/30
                    transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Checking…</>
                  ) : (
                    <>Continue <ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Phase: Done */}
        {phase === "done" && (
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-church-maroon/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-church-accent" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-3">You're checked in!</h2>
              <p className="text-white/45 text-sm leading-relaxed max-w-xs mx-auto">
                We've noted your second visit. Our team will set up your account shortly — keep an eye on your email.
              </p>
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <button
                  onClick={() => { setPhase("select"); setEmail(""); setError(""); }}
                  className="text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
