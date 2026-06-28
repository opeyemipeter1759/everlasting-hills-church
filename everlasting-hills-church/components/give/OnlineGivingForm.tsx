"use client";

import { useState } from "react";
import { Loader2, ArrowRight, HeartHandshake } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

const CATEGORIES = ["Tithe", "Offering", "Building Fund", "Missions", "General"];
const PRESETS = [1000, 2000, 5000, 10000, 20000];

export default function OnlineGivingForm() {
  const [amount, setAmount] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tithe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    typeof amount === "number" && amount >= 100 && /\S+@\S+\.\S+/.test(email) && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post<{ authorizationUrl: string; reference: string }>(
        "/giving/initialize",
        { amount, email, name: name.trim() || undefined, category },
      );
      const url = res.data?.authorizationUrl;
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url; // Redirect to Paystack
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message ?? "Could not start payment. Please try again.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <section id="give-online" className="relative z-10 container mx-auto px-6 pt-12 max-w-3xl">
      <div className="rounded-3xl border border-church-accent/15 bg-white/[0.02] backdrop-blur-md p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-church-maroon/20 flex items-center justify-center text-church-accent">
            <HeartHandshake size={20} />
          </span>
          <div>
            <h2 className="font-display text-xl font-black uppercase tracking-wide text-white">
              Give Online
            </h2>
            <p className="text-white/40 text-xs font-medium">
              Secure card payment via Paystack
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  amount === p
                    ? "bg-church-maroon text-white"
                    : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
                }`}
              >
                ₦{p.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-white/40 mb-2">
              Amount (₦)
            </label>
            <input
              type="number"
              min={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="Enter amount"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-5 text-white placeholder-white/20 focus:outline-none focus:border-church-accent/40 transition-all font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-white/40 mb-2">
              Purpose
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    category === c
                      ? "bg-church-accent text-church-dark"
                      : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Name + email */}
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-5 text-white placeholder-white/20 focus:outline-none focus:border-church-accent/40 transition-all font-medium"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for receipt"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-5 text-white placeholder-white/20 focus:outline-none focus:border-church-accent/40 transition-all font-medium"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#87102C] to-[#a52242] px-6 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting to Paystack...
              </>
            ) : (
              <>
                Give Securely
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-white/30">
            You will be redirected to Paystack to complete your gift.
          </p>
        </form>
      </div>
    </section>
  );
}
