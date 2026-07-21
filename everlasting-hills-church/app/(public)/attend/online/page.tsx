"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/axios";
import { Youtube, Send, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

type Channel = "YOUTUBE" | "TELEGRAM";
type Stage = "FIRST_TIMER" | "SECOND_TIMER" | "ONLINE_MEMBER";
type Action = "redirect_first_timer" | "account_created" | "checked_in";

interface CheckInResponse {
  action: Action;
  stage: Stage;
  visitCount?: number;
}

const CHANNELS: { id: Channel; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "YOUTUBE",
    label: "YouTube",
    icon: <Youtube size={22} />,
    description: "Watching on Everlasting Hills YouTube",
  },
  {
    id: "TELEGRAM",
    label: "Telegram",
    icon: <Send size={18} />,
    description: "Joining via the Telegram channel",
  },
];

function SuccessCard({ action, name, channel }: { action: Action; name: string; channel: Channel }) {
  const channelLabel = channel === "YOUTUBE" ? "YouTube" : "Telegram";
  const firstName = name.split(" ")[0] || "Friend";

  if (action === "checked_in") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Welcome back, {firstName}!</h2>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
          Your check-in has been recorded. We're glad you're joining us online on {channelLabel} today.
        </p>
      </div>
    );
  }

  if (action === "account_created") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-church-maroon/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-church-accent" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Great to see you again, {firstName}!</h2>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
          We've created an account for you. Check your email — we've sent a link to set your password and access the full EHC community.
        </p>
      </div>
    );
  }

  // redirect_first_timer — handled in the component, but fallback:
  return null;
}

export default function OnlineAttendancePage() {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckInResponse | null>(null);

  const canSubmit = channel && email.includes("@") && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post<CheckInResponse>("/online-attendance/check-in", {
        email: email.trim().toLowerCase(),
        channel,
        name: name.trim() || undefined,
      });

      if (res.action === "redirect_first_timer") {
        const params = new URLSearchParams({
          email: email.trim().toLowerCase(),
          attendance_type: "Online",
          ...(name.trim() ? { name: name.trim() } : {}),
        });
        router.push(`/first-timer?${params.toString()}`);
        return;
      }

      setResult(res);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon relative overflow-x-hidden flex items-center justify-center px-5 py-12">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] bg-church-maroon/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[45%] h-[45%] bg-church-maroon/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-church-accent mb-3">
            Online Attendance
          </p>
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            Checking in?<br />
            <span className="text-white/40 font-normal italic font-serif text-2xl sm:text-3xl">
              We see you.
            </span>
          </h1>
          <p className="text-white/45 text-sm">
            Let us know you're here — it only takes a moment.
          </p>
        </div>

        {result ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10">
            <SuccessCard action={result.action} name={name} channel={channel!} />
            <button
              onClick={() => { setResult(null); setEmail(""); setName(""); setChannel(null); }}
              className="mt-8 w-full rounded-2xl border border-white/[0.08] py-3 text-sm font-semibold text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
            >
              Check in another person
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10 space-y-6">
            {/* Channel picker */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/35 mb-3">
                Where are you watching?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`
                      flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all
                      ${channel === c.id
                        ? "border-church-maroon bg-church-maroon/10 text-white"
                        : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/70"
                      }
                    `}
                  >
                    <span className={channel === c.id ? "text-church-accent" : ""}>{c.icon}</span>
                    <span className="text-xs font-semibold tracking-wide">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/35">
                Email address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-church-maroon/40 transition-shadow"
              />
              <p className="text-white/25 text-[11px]">
                We use this to track your attendance across visits.
              </p>
            </div>

            {/* Name (optional on first visit) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/35">
                Your name <span className="normal-case font-normal tracking-normal text-white/20">(first visit only)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayo Adekoya"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-church-maroon/40 transition-shadow"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-church-maroon py-4 text-sm font-black tracking-wide text-white hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-church-maroon/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Checking in…
                </>
              ) : (
                <>
                  Check In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
