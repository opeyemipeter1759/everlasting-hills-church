import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, MessageCircle, PhoneCall } from "lucide-react";
import { CHURCH } from "@/config/config";
import { muted } from "./tokens";

export function ProfileCompletionMeter({ profilePct }: { profilePct: number }) {
  if (profilePct >= 100) return null;
  return (
    <div className="mt-4 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">Profile {profilePct}% complete</p>
        <Link href="/dashboard/profile" className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5">
          Fill in <ChevronRight size={10} />
        </Link>
      </div>
      <div className="h-1.5 rounded-full bg-sky-200/60 dark:bg-sky-500/20 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-sky-500"
          initial={{ width: 0 }}
          animate={{ width: `${profilePct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function NewMemberWelcomeNote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      className="mt-5 rounded-2xl overflow-hidden border border-[#E7CDD3]/60 dark:border-white/[0.09]"
      style={{ background: "linear-gradient(135deg, #2a0410 0%, #4a0819 55%, #87102C 100%)" }}
    >
      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] pointer-events-none rounded-2xl"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative p-5 flex gap-4 items-start">
        {/* Pastor avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
          <span className="text-base font-extrabold text-white">PT</span>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFB3C1]/70 mb-0.5">
            Personal message
          </p>
          <p className="text-sm font-bold text-white leading-snug">
            Pastor Tobi Adeyemi
          </p>
          <p className="text-[12px] text-white/65 mt-2 leading-relaxed">
            Welcome to the Everlasting Hills family! I&apos;m so glad you&apos;re here.
            I&apos;d love to personally connect with you this week — feel free to reach
            out anytime.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 mt-4">
            <a
              href={CHURCH.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-[#87102C] text-[11px] font-bold hover:bg-white/90 transition-all"
            >
              <MessageCircle size={12} />
              Say hello on WhatsApp
            </a>
            <a
              href={`tel:${CHURCH.phone}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white text-[11px] font-semibold hover:bg-white/25 transition-all"
            >
              <PhoneCall size={12} />
              Call the church
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function OnboardingCompleteNote() {
  return (
    <div className="mt-5 p-4 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30 text-center">
      <p className="text-sm font-bold text-[#87102C] dark:text-[#FFB3C1]">🎉 You&apos;re all set!</p>
      <p className={`text-xs ${muted} mt-0.5`}>Welcome to the Everlasting Hills family.</p>
    </div>
  );
}
