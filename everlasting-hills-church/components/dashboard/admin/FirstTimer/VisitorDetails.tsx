"use client";

import { useState } from "react";
import {
  Briefcase,
  Cake,
  ClipboardCopy,
  Check,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import type { VisitorRow } from "./types";
import type { FirstTimerAnalysis } from "@/app/api/ai/first-timer/route";
import { postAi } from "@/lib/ai/client";

const SENTIMENT_COLOR: Record<string, string> = {
  positive:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  neutral:    "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/50",
  seeking:    "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  distressed: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

const SCORE_COLOR = (score: number) =>
  score >= 8 ? "text-emerald-600 dark:text-emerald-400" :
  score >= 5 ? "text-amber-600 dark:text-amber-400" :
               "text-rose-600 dark:text-rose-400";

export default function VisitorDetails({ visitor }: { visitor: VisitorRow }) {
  const [analysis, setAnalysis] = useState<FirstTimerAnalysis | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  async function analyse() {
    setLoading(true);
    setError("");
    try {
      const data = await postAi<FirstTimerAnalysis>("/api/ai/first-timer", {
        firstName:         visitor.firstName,
        membershipInterest:visitor.membershipInterest,
        howDidYouLearn:    visitor.howDidYouLearn,
        bornAgain:         visitor.bornAgain,
        locatedInIbadan:   visitor.locatedInIbadan,
        attendanceType:    visitor.attendanceType,
        serviceExperience: visitor.serviceExperience ?? null,
        prayerPoint:       visitor.prayerPoint ?? null,
      });
      setAnalysis(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copyScript() {
    if (!analysis?.contactScript) return;
    await navigator.clipboard.writeText(analysis.contactScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <tr className="bg-[#FFF4F6]/40 dark:bg-white/[0.02] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
      <td colSpan={6} className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">

          {/* Contact */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">Contact</p>
            {visitor.email && (
              <a href={`mailto:${visitor.email}`} className="flex items-center gap-2 text-[#555] dark:text-white/60 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors">
                <Mail size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.email}
              </a>
            )}
            {visitor.phone && (
              <a href={`tel:${visitor.phone}`} className="flex items-center gap-2 text-[#555] dark:text-white/60 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors">
                <Phone size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.phone}
              </a>
            )}
            {visitor.locatedInIbadan !== null && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <MapPin size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.locatedInIbadan ? "Based in Ibadan" : "Visiting / outside Ibadan"}
              </span>
            )}
          </div>

          {/* About */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">About</p>
            {visitor.gender && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <span className="text-[#b8a8ac] dark:text-white/30">Gender:</span> {visitor.gender}
              </span>
            )}
            {visitor.occupation && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <Briefcase size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.occupation}
              </span>
            )}
            {visitor.bornAgain && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <span className="text-[#b8a8ac] dark:text-white/30">Born again:</span> {visitor.bornAgain}
              </span>
            )}
            {visitor.dateOfBirth && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <Cake size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.dateOfBirth}
              </span>
            )}
            {visitor.attendanceType && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <span className="text-[#b8a8ac] dark:text-white/30">Attended:</span> {visitor.attendanceType}
              </span>
            )}
            {visitor.membershipInterest && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <span className="text-[#b8a8ac] dark:text-white/30">Coming back:</span>{" "}
                {visitor.membershipInterest}
              </span>
            )}
            {visitor.address && (
              <span className="flex items-start gap-2 text-[#8a7e80] dark:text-white/45">
                <Home size={12} className="mt-0.5 text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.address}
              </span>
            )}
            {visitor.whatsappInterest != null && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <MessageCircle size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.whatsappInterest ? "Wants the WhatsApp group" : "Not interested in WhatsApp"}
              </span>
            )}
          </div>

          {/* How they found us */}
          {visitor.howDidYouLearn && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">How They Found Us</p>
              <p className="text-[#555] dark:text-white/60">{visitor.howDidYouLearn}</p>
              {visitor.invitedBy && (
                <p className="text-[#8a7e80] dark:text-white/45">
                  <span className="text-[#b8a8ac] dark:text-white/30">Invited by:</span>{" "}
                  <span className="font-semibold text-[#555] dark:text-white/70">{visitor.invitedBy}</span>
                </p>
              )}
            </div>
          )}

          {/* What they wrote in their own words. These two are the reason an
              admin opens this panel at all, and were only reachable through the
              AI summary before. */}
          {(visitor.serviceExperience || visitor.prayerPoint) && (
            <div className="space-y-3">
              {visitor.serviceExperience && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
                    How the service felt
                  </p>
                  <p className="whitespace-pre-line text-[#555] dark:text-white/60">
                    {visitor.serviceExperience}
                  </p>
                </div>
              )}
              {visitor.prayerPoint && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
                    Prayer request
                  </p>
                  <p className="whitespace-pre-line text-[#555] dark:text-white/60">{visitor.prayerPoint}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Gemini AI Analysis ─────────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-[#E7CDD3]/40 dark:border-white/[0.07]">
          {!analysis && !loading ? (
            <button
              type="button"
              onClick={analyse}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-500/25 bg-violet-50 dark:bg-violet-500/[0.08] px-3.5 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/15 transition-colors"
            >
              <Sparkles size={13} />
              Analyse with Gemini AI
            </button>
          ) : loading ? (
            <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
              <Loader2 size={13} className="animate-spin" />
              Gemini is analysing this visitor…
            </div>
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : analysis ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Insight + Score */}
              <div className="rounded-xl border border-violet-100 dark:border-violet-500/20 bg-violet-50/60 dark:bg-violet-500/[0.06] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    <Sparkles size={11} /> Gemini Insight
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${SENTIMENT_COLOR[analysis.sentiment] ?? SENTIMENT_COLOR.neutral}`}>
                      {analysis.sentiment}
                    </span>
                    <span className={`text-sm font-black tabular-nums ${SCORE_COLOR(analysis.conversionScore)}`}>
                      {analysis.conversionScore}/10
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#555] dark:text-white/60 leading-relaxed">{analysis.insight}</p>
                <p className="text-[10px] text-violet-500 dark:text-violet-400 italic">{analysis.primaryNeed}</p>
                <p className="text-[10px] text-gray-400 dark:text-white/30">{analysis.conversionReason}</p>
              </div>

              {/* Contact script */}
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    Suggested Opening Message
                  </p>
                  <button
                    type="button"
                    onClick={copyScript}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
                  >
                    {copied ? <Check size={11} /> : <ClipboardCopy size={11} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-[#555] dark:text-white/60 leading-relaxed italic">
                  &ldquo;{analysis.contactScript}&rdquo;
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
