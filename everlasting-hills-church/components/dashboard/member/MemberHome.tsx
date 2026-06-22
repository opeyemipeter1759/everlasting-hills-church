"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Heart, Clock, Calendar, CheckCircle2,
  BookOpen, Sparkles, Bell, ChevronRight, TrendingUp,
  User, Camera, Headphones, Bookmark, Play, Pause,
  Hand, Youtube, MessageCircle, MapPin,
  Send, PhoneCall, CalendarPlus, ListChecks,
  Gift, Mic, Users, QrCode, X as XIcon, Star,
  BellRing, Award,
} from "lucide-react";
import { CHURCH } from "@/config/config";

const DEV_ALWAYS_SHOW_CHECKIN = true;

// ── Design tokens (match admin DashboardCard exactly) ────────────────────────
const card   = "flex flex-col rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.05] shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none";
const hdrBdr = "border-b border-[#E7CDD3]/40 dark:border-white/[0.07]";
const iconBg  = "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25";
const iconCl  = "text-[#87102C] dark:text-[#FFB3C1]";
const kicker  = "text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]";
const cardTitle = "text-sm font-bold text-[#111] dark:text-white";
const muted   = "text-[#8a7e80] dark:text-white/45";
const linkCl  = "text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:underline flex items-center gap-0.5";

// ── Daily Scripture rotation ──────────────────────────────────────────────────

const DAILY_SCRIPTURES = [
  { verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
  { verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", reference: "Proverbs 3:5-6" },
  { verse: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
  { verse: "The Lord is my shepherd, I lack nothing.", reference: "Psalm 23:1" },
  { verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
  { verse: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", reference: "Matthew 6:33" },
  { verse: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
  { verse: "The name of the Lord is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10" },
  { verse: "Give thanks to the Lord, for he is good; his love endures forever.", reference: "Psalm 107:1" },
  { verse: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
  { verse: "Delight yourself in the Lord, and he will give you the desires of your heart.", reference: "Psalm 37:4" },
  { verse: "No weapon formed against you shall prosper.", reference: "Isaiah 54:17" },
  { verse: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", reference: "Galatians 6:9" },
];

function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

function getDailyScripture() {
  const idx = getDayIndex();
  return DAILY_SCRIPTURES[idx % DAILY_SCRIPTURES.length];
}

// ── Daily Pastor Words ────────────────────────────────────────────────────────

const DAILY_PASTOR_WORDS = [
  "God does not call the qualified — He qualifies the called. Step boldly into today knowing He has fully equipped you.",
  "Your faithfulness today is a seed. Trust that what is planted in obedience will bloom in God's perfect time.",
  "You are not an accident. God knew you before the foundations of the earth — walk in the confidence of that truth.",
  "Rest is not weakness; it is faith that God holds what you release. Take a deep breath today.",
  "The enemy fights hardest against those God is preparing for the greatest things. Do not retreat from the resistance.",
  "Every prayer you have ever prayed is held in the heart of God. Not one has been lost or forgotten.",
  "You are one decision away from your breakthrough. Let it be a decision toward God today.",
  "Do not compare your chapter one to someone else's chapter ten. Trust your pace — trust your Shepherd.",
  "Excellence in the small things is how God prepares us for the great. Be faithful with what is in front of you.",
  "His mercies are new every morning. Do not carry yesterday's weight into today.",
  "Your tears water the seeds of your miracle. God sees every one of them.",
  "Community is not optional in the Kingdom — it is essential. Who can you encourage today?",
  "Grace is not a license to stay where you are; it is the power to become who God created you to be.",
  "This season is not your conclusion. The same God who began a good work in you will carry it to completion.",
];

// ── Daily Prayer Prompts ──────────────────────────────────────────────────────

const DAILY_PRAYER_PROMPTS = [
  "Lord, align my heart with Your will today. Let my plans bow to Yours.",
  "Father, I thank You for those You have placed in my life. Bless them abundantly today.",
  "Jesus, reveal any area where I am holding back from full surrender. I give You all of me.",
  "Holy Spirit, guide my words and decisions. May every action today glorify the Father.",
  "Lord, grant me wisdom for the decisions I am facing this season. I trust Your direction.",
  "Father, heal every broken relationship in my life and in the lives of those I love.",
  "Jesus, I release every fear and anxiety to You. You are my peace and my strength.",
  "Lord, open my eyes to the needs around me and give me the courage to meet them.",
  "Father, I pray for our church family today — may every member feel loved and seen.",
  "Holy Spirit, reignite the fire in my heart. Let passion for God's Kingdom burn bright in me.",
  "Lord, I pray for our nation and leaders. Bring righteous governance and peace to our land.",
  "Jesus, where I have fallen short, I receive Your mercy. Teach me and lead me forward.",
  "Father, I believe You for a miracle in this season. Let my faith not waver.",
  "Lord, use me today — in small and great ways — to make Your love known to those around me.",
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemberHomeProps {
  member: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    bio: string | null;
    photoUrl: string | null;
  } | null;
  userEmail: string;
  memberDisplayId: string;
  attendanceRate: number;
  attendanceCount: number;
  streakWeeks: number;
  lastServiceDate: string | null;
  nextService: { name: string; scheduledAt: string } | null;
  hasCheckedInToday: boolean;
  todayService: { id: string; name: string; sermonTitle?: string | null } | null;
  prayerCount: number;
  recentServices: Array<{ name: string; scheduledAt: string; totalAttended: number }>;
  monthlyAttendance: Array<{ label: string; attended: number; total: number }>;
  birthdayDaysUntil: number | null;
  sermonStreak: number;
  bookmarks: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioUrl: string | null }>;
  listenHistory: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; positionSec: number; completed: boolean; audioDuration: number | null }>;
  // New optional props — null/empty defaults; no backend required yet
  announcements?: Array<{ id: string; title: string; body: string; createdAt: string }>;
  communityBirthdays?: Array<{ firstName: string; lastName: string; photoUrl: string | null }>;
  ministryUnit?: { name: string; nextServingDate: string | null } | null;
  featuredSermon?: {
    slug: string; title: string; speaker: string; date: string;
    thumbnailUrl: string | null; audioUrl: string | null; description?: string | null;
  } | null;
  pastorWord?: { text: string; audioUrl?: string | null } | null;
  dailyPrayer?: string | null;
  communityFeed?: Array<{
    id: string; authorName: string; authorPhotoUrl: string | null;
    text: string; createdAt: string; reactions: number;
  }>;
  onlineCount?: number | null;
  discipleshipMilestones?: Array<{ label: string; completedAt: string | null }>;
  memberSince?: string | null;
  anniversaryDaysUntil?: number | null;
}

type MemberHomePropsOptional = Partial<MemberHomeProps>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Last week";
  return `${weeks} weeks ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function standingLabel(rate: number): { text: string; color: string } {
  if (rate >= 90) return { text: "Excellent Standing", color: "text-emerald-600 dark:text-emerald-400" };
  if (rate >= 70) return { text: "Good Standing",     color: "text-sky-600 dark:text-sky-400"     };
  if (rate >= 50) return { text: "Fair Standing",     color: "text-amber-600 dark:text-amber-400"  };
  if (rate > 0)   return { text: "Needs Improvement", color: "text-red-500 dark:text-red-400"      };
  return            { text: "No records yet",          color: `${muted}`                            };
}

function streakLabel(weeks: number): { text: string; dot: string } {
  if (weeks >= 8) return { text: "Consistent level", dot: "bg-purple-500" };
  if (weeks >= 4) return { text: "Firm level",        dot: "bg-emerald-500" };
  if (weeks >= 2) return { text: "Building level",    dot: "bg-sky-500"    };
  if (weeks === 1) return { text: "Starting level",   dot: "bg-amber-500"  };
  return             { text: "No streak yet",         dot: "bg-gray-300 dark:bg-white/20"   };
}

function getServiceCountdown(scheduledAt: string): string {
  const ms = new Date(scheduledAt).getTime() - Date.now();
  if (ms <= 0) return "Now";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}

// ── Circular Progress ─────────────────────────────────────────────────────────

function CircleProgress({ value, size = 40 }: { value: number; size?: number }) {
  const r = size * 0.375;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0 -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="4"
        className="stroke-[#E7CDD3]/60 dark:stroke-white/10" />
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="4"
        stroke="#87102C" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" />
    </svg>
  );
}

// ── Panel Card (shared premium card shell) ────────────────────────────────────

function PanelCard({
  kicker: k, title, icon: Icon, action, children, bodyClass = "p-5 sm:p-6",
}: {
  kicker: string;
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClass?: string;
}) {
  return (
    <section className={card}>
      <div className={`flex items-center justify-between gap-3 ${hdrBdr} px-5 py-4 sm:px-6`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={iconBg}>
            <Icon size={15} className={iconCl} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={kicker}>{k}</p>
            <h3 className={`${cardTitle} truncate`}>{title}</h3>
          </div>
        </div>
        {action}
      </div>
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

// ── QR Code Modal ─────────────────────────────────────────────────────────────

function QRModal({ memberDisplayId, onClose }: { memberDisplayId: string; onClose: () => void }) {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.default.toDataURL(memberDisplayId, { width: 220, margin: 2, color: { dark: "#87102C", light: "#fff9fb" } })
        .then((url) => { if (!cancelled) setQrSrc(url); })
        .catch(console.error);
    });
    return () => { cancelled = true; };
  }, [memberDisplayId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-white dark:bg-[#1a0610] rounded-3xl shadow-2xl p-7 flex flex-col items-center gap-4 max-w-xs w-full border border-[#E7CDD3]/60 dark:border-white/[0.12]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <XIcon size={14} className="text-[#8a7e80] dark:text-white/60" />
        </button>

        <div className="text-center">
          <p className={kicker}>Member ID</p>
          <h3 className={cardTitle}>{memberDisplayId}</h3>
        </div>

        <div className="p-3 rounded-2xl bg-[#fff9fb] dark:bg-white border border-[#E7CDD3]/60 dark:border-transparent">
          {qrSrc ? (
            <img src={qrSrc} alt={`QR code for ${memberDisplayId}`} className="w-44 h-44" />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#87102C]/30 border-t-[#87102C] rounded-full animate-spin" />
            </div>
          )}
        </div>

        <p className={`text-xs ${muted} text-center`}>
          Show this QR to an usher to check in at service
        </p>
      </motion.div>
    </div>
  );
}

// ── Band 1: Welcome Hero ──────────────────────────────────────────────────────

function WelcomeHero({ firstName, initials, photoUrl, memberDisplayId, attendanceRate, streakWeeks, nextService }: {
  firstName: string;
  initials: string;
  photoUrl: string | null;
  memberDisplayId: string;
  attendanceRate: number;
  streakWeeks: number;
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
        {/* Left: avatar + text */}
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl ring-2 ring-white/20 ring-offset-2 ring-offset-transparent overflow-hidden bg-white/10 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-white">{initials}</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#87102C]" />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-[#FFB3C1] mb-1.5 hover:text-white transition-colors group"
              title="Tap to show QR code"
            >
              {memberDisplayId} · {date}
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
          {streakWeeks > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <Zap size={14} aria-hidden="true" />
              {streakWeeks}-week streak
            </span>
          )}
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

// ── Band 1: Birthday Banner ───────────────────────────────────────────────────

function BirthdayBanner({ firstName, daysUntil }: { firstName: string; daysUntil: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-200/60 dark:border-pink-500/20 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 px-6 py-4 flex items-center gap-4">
      <span className="text-3xl flex-shrink-0" aria-hidden="true">{daysUntil === 0 ? "🎂" : "🎉"}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-pink-700 dark:text-pink-300">
          {daysUntil === 0
            ? `Happy Birthday, ${firstName}! 🎊`
            : `Your birthday is ${daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`}!`}
        </p>
        <p className="text-xs text-pink-500/80 dark:text-pink-400/80 mt-0.5">
          {daysUntil === 0
            ? "The Everlasting Hills family celebrates you today."
            : "Sending warm wishes ahead from the EHC family."}
        </p>
      </div>
    </div>
  );
}

// ── Band 1: Anniversary Banner ────────────────────────────────────────────────

function AnniversaryBanner({ firstName, memberSince, daysUntil }: {
  firstName: string;
  memberSince: string;
  daysUntil: number;
}) {
  const years = new Date().getFullYear() - new Date(memberSince).getFullYear();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 px-6 py-4 flex items-center gap-4">
      <span className="text-3xl flex-shrink-0" aria-hidden="true">{daysUntil === 0 ? "🎊" : "📅"}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
          {daysUntil === 0
            ? `Happy ${years}-year anniversary, ${firstName}!`
            : `Your ${years}-year church anniversary is ${daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`}!`}
        </p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
          {daysUntil === 0
            ? `${years} year${years !== 1 ? "s" : ""} of faithfulness — the EHC family celebrates you today.`
            : "We are grateful for your years of faithful commitment to this community."}
        </p>
      </div>
    </div>
  );
}

// ── Band 1: Scripture Card ────────────────────────────────────────────────────

function ScriptureCard() {
  const scripture = getDailyScripture();
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(145deg, #16040f 0%, #280818 55%, #3a0c20 100%)" }}
    >
      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Amber left accent rule */}
      <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full bg-gradient-to-b from-amber-400/70 via-amber-300/40 to-transparent" />

      <div className="relative z-10 px-7 py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/60 mb-4">
          Scripture of the Day
        </p>
        <div className="flex gap-3 items-start">
          <span aria-hidden="true" className="text-5xl text-amber-400/30 font-serif leading-none flex-shrink-0 mt-0.5 select-none">
            &ldquo;
          </span>
          <div className="min-w-0">
            <p className="text-white/85 text-[15px] leading-[1.75] font-medium italic">
              {scripture.verse}
            </p>
            <p className="text-amber-300/60 text-[11px] font-bold uppercase tracking-[0.22em] mt-3.5">
              — {scripture.reference}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Band 1: Pastor's Word ─────────────────────────────────────────────────────

function PastorWordCard({ pastorWord }: { pastorWord?: MemberHomeProps["pastorWord"] }) {
  const text = pastorWord?.text ?? DAILY_PASTOR_WORDS[getDayIndex() % DAILY_PASTOR_WORDS.length];
  const audioUrl = pastorWord?.audioUrl ?? null;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { void audioRef.current.play(); setPlaying(true); }
  }

  return (
    <PanelCard kicker="Pastoral" title="Pastor&apos;s Word for Today" icon={Mic}>
      <blockquote className="text-sm text-[#111] dark:text-white leading-[1.75] italic border-l-2 border-[#87102C]/30 dark:border-[#FFB3C1]/20 pl-4">
        &ldquo;{text}&rdquo;
      </blockquote>
      {audioUrl && (
        <div className="flex items-center gap-3 mt-4 p-3.5 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/15 border border-[#E7CDD3]/60 dark:border-[#87102C]/30">
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
          <button
            type="button"
            onClick={togglePlay}
            className={`${iconBg} flex-shrink-0`}
            aria-label={playing ? "Pause" : "Play message"}
          >
            {playing
              ? <Pause size={13} className={iconCl} />
              : <Play size={13} className={iconCl} fill="currentColor" />}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">60-second message</p>
            <p className={`text-[11px] ${muted}`}>{playing ? "Playing…" : "Tap to listen"}</p>
          </div>
        </div>
      )}
    </PanelCard>
  );
}

// ── Band 1: Daily Prayer Prompt ───────────────────────────────────────────────

function DailyPrayerPrompt({ dailyPrayer }: { dailyPrayer?: string | null }) {
  const prompt = dailyPrayer ?? DAILY_PRAYER_PROMPTS[getDayIndex() % DAILY_PRAYER_PROMPTS.length];
  return (
    <section className={`${card} bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-white/[0.05]`}>
      <div className={`flex items-center gap-3 ${hdrBdr} px-5 py-4`}>
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
          <Heart size={15} className="text-violet-600 dark:text-violet-400" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">Daily Prayer</p>
          <h3 className={cardTitle}>Today&apos;s Prompt</h3>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-[#111] dark:text-white leading-relaxed">{prompt}</p>
        <Link
          href="/dashboard/prayer-requests"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Write a prayer request <ChevronRight size={12} />
        </Link>
      </div>
    </section>
  );
}

// ── Band 1: Quick Actions Strip ───────────────────────────────────────────────

function QuickActionsStrip() {
  const actions = [
    {
      icon: Send, label: "Submit Prayer", href: "/dashboard/prayer-requests", external: false,
      cls: "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/25",
      iconCls: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: Youtube, label: "Watch Sermon", href: CHURCH.youtubeUrl, external: true,
      cls: "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] border-[#E7CDD3]/60 dark:border-[#87102C]/30 hover:bg-rose-100 dark:hover:bg-[#87102C]/35",
      iconCls: "text-[#87102C] dark:text-[#FFB3C1]",
    },
    {
      icon: Heart, label: "Give", href: "#give", external: false,
      cls: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/25",
      iconCls: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: PhoneCall, label: "Call Pastor", href: `tel:${CHURCH.phone}`, external: true,
      cls: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/25",
      iconCls: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: CalendarPlus, label: "Plan a Visit", href: "/contact", external: false,
      cls: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/25",
      iconCls: "text-sky-600 dark:text-sky-400",
    },
  ];

  const base = "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all";

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
      {actions.map((a) => {
        const Icon = a.icon;
        return a.external ? (
          <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className={`${base} ${a.cls}`}>
            <Icon size={13} className={a.iconCls} aria-hidden="true" />
            {a.label}
          </a>
        ) : (
          <Link key={a.label} href={a.href} className={`${base} ${a.cls}`}>
            <Icon size={13} className={a.iconCls} aria-hidden="true" />
            {a.label}
          </Link>
        );
      })}
    </div>
  );
}

// ── Band 2: Cosmic Backdrop ───────────────────────────────────────────────────

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
            top: d.top, left: d.left,
            width: d.size, height: d.size,
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
        type="button" onClick={onClick} disabled={loading}
        aria-label="Check in for today's service"
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#FFB3C1] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0e0407] rounded-full disabled:cursor-not-allowed"
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
      >
        {[0, 0.8, 1.6].map((delay, i) => (
          <motion.span
            key={i} aria-hidden="true"
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
          <span aria-hidden="true" className="absolute inset-1 rounded-full bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
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

function NoServiceCenter({ nextService }: { nextService: MemberHomeProps["nextService"] }) {
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
          className="absolute inset-0 rounded-full bg-emerald-400/25"
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

// ── Band 2: Check-in Panel ────────────────────────────────────────────────────

function CheckInPanel({
  todayService, hasCheckedInToday, nextService,
}: {
  todayService: MemberHomeProps["todayService"];
  hasCheckedInToday: boolean;
  nextService: MemberHomeProps["nextService"];
}) {
  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveTodayService = DEV_ALWAYS_SHOW_CHECKIN
    ? todayService ?? { id: "dev-preview", name: "Today's Service" }
    : todayService;

  async function handleCheckIn() {
    setLoading(true); setError("");
    try {
      const { apiClient } = await import("@/lib/api/axios");
      await apiClient.post("/attendance/check-in");
      setCheckedIn(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Check-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isServiceDay = !!effectiveTodayService;
  const serviceName = effectiveTodayService?.name ?? "Everlasting Hills";
  const todayDay = new Date().getDay();
  const serviceTime = todayDay === 0 ? "9:00 AM" : todayDay === 3 ? "5:30 PM" : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] border border-white/[0.07] min-h-[440px] shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
      <CosmicBackdrop />

      <div className="relative z-10 flex flex-col h-full p-7 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FFB3C1]/70">
            {isServiceDay ? "Today's Service" : "Next Service"}
          </p>
          <h2 className="text-white text-xl sm:text-2xl font-bold mt-1.5">{serviceName}.</h2>

          {isServiceDay && serviceTime && (
            <div className="flex flex-wrap items-center gap-3 mt-2.5">
              <span className="flex items-center gap-1.5 text-white/45 text-[11px]">
                <Clock size={11} className="text-[#FFB3C1]/50" />
                {serviceTime}
              </span>
              <span className="w-px h-3 bg-white/15" />
              <span className="flex items-center gap-1.5 text-white/45 text-[11px]">
                <MapPin size={11} className="text-[#FFB3C1]/50" />
                Hills Auditorium, Ibadan
              </span>
              {effectiveTodayService?.sermonTitle && (
                <>
                  <span className="w-px h-3 bg-white/15" />
                  <span className="flex items-center gap-1.5 text-white/45 text-[11px]">
                    <BookOpen size={11} className="text-[#FFB3C1]/50" />
                    <span className="italic">{effectiveTodayService.sermonTitle}</span>
                  </span>
                </>
              )}
            </div>
          )}

          {!isServiceDay && nextService && (
            <p className="text-white/35 text-[11px] mt-2">
              {fmtDate(nextService.scheduledAt, { weekday: "short", day: "numeric", month: "short" })}
              {" · "}{fmtTime(nextService.scheduledAt)}
            </p>
          )}

          <div className="h-px w-10 bg-white/20 mt-3.5" />
        </div>

        {/* Center stage */}
        <div className="flex-1 flex items-center justify-center py-6">
          {checkedIn
            ? <CheckedInCenter />
            : isServiceDay
            ? <ServiceDayCenter onClick={handleCheckIn} loading={loading} />
            : <NoServiceCenter nextService={nextService} />}
        </div>

        {error && (
          <p className="text-center text-xs text-red-300 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Band 2: Today Info Panel (right) ─────────────────────────────────────────

function TodayInfoPanel({
  nextService, isServiceDay, hasCheckedIn, featuredSermon,
}: {
  nextService: MemberHomeProps["nextService"];
  isServiceDay: boolean;
  hasCheckedIn: boolean;
  featuredSermon: MemberHomeProps["featuredSermon"];
}) {
  if (isServiceDay && hasCheckedIn) {
    return (
      <PanelCard kicker="You're Here" title="Attendance Recorded" icon={CheckCircle2}>
        <div className="flex flex-col items-center justify-center py-6 text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111] dark:text-white">Enjoy today&apos;s service!</p>
            <p className={`text-xs ${muted} mt-1 max-w-[200px] mx-auto leading-relaxed`}>
              Your presence has been marked. God bless you today.
            </p>
          </div>
          <div className="w-full space-y-2.5">
            <a href={CHURCH.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] text-xs font-semibold hover:bg-rose-100 dark:hover:bg-[#87102C]/35 transition-all">
              <Youtube size={13} />
              Watch on YouTube
            </a>
            <Link href="/dashboard/prayer-requests"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-[#E7CDD3]/60 dark:border-white/[0.09] text-[#8a7e80] dark:text-white/55 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all">
              <MessageCircle size={13} />
              Visit the Prayer Wall
            </Link>
          </div>
        </div>
      </PanelCard>
    );
  }

  if (!isServiceDay && nextService) {
    const countdown = getServiceCountdown(nextService.scheduledAt);
    return (
      <PanelCard kicker="Upcoming" title="Next Service" icon={Calendar}>
        <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center">
            <Calendar size={28} className={iconCl} />
          </div>
          <div>
            <p className={`${kicker} mb-1`}>Countdown</p>
            <p className="text-3xl font-black text-[#111] dark:text-white tabular-nums">{countdown}</p>
            <p className="text-sm font-semibold text-[#8a7e80] dark:text-white/55 mt-1.5">{nextService.name}</p>
            <p className={`text-xs ${muted} mt-0.5`}>
              {fmtDate(nextService.scheduledAt, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className={`text-xs ${muted}`}>
              {fmtTime(nextService.scheduledAt)} · Hills Auditorium
            </p>
          </div>
          <a href={CHURCH.youtubeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] text-xs font-semibold hover:bg-rose-100 dark:hover:bg-[#87102C]/35 transition-all">
            <Youtube size={13} />
            Watch while you wait
          </a>
        </div>
      </PanelCard>
    );
  }

  if (featuredSermon) {
    return (
      <PanelCard kicker="This Week" title="Featured Sermon" icon={Mic}>
        <div className="space-y-4">
          {featuredSermon.thumbnailUrl ? (
            <img src={featuredSermon.thumbnailUrl} alt={featuredSermon.title}
              className="w-full aspect-video rounded-xl object-cover" />
          ) : (
            <div className="w-full aspect-video rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center">
              <BookOpen size={24} className={iconCl} />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-[#111] dark:text-white leading-snug line-clamp-2">
              {featuredSermon.title}
            </p>
            <p className={`text-xs ${muted} mt-0.5`}>{featuredSermon.speaker}</p>
          </div>
          <Link href={`/sermons/${featuredSermon.slug}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#87102C] text-white text-xs font-semibold hover:bg-[#6E0C24] transition-all">
            <Play size={12} fill="currentColor" />
            Listen now
          </Link>
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard kicker="Community" title="Stay Connected" icon={Users}>
      <div className="flex flex-col gap-3">
        <a
          href={CHURCH.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30 hover:bg-rose-100 dark:hover:bg-[#87102C]/30 transition-colors group"
        >
          <span className={iconBg}>
            <Youtube size={15} className={iconCl} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">Watch on YouTube</p>
            <p className={`text-[11px] ${muted}`}>Sermons, live services &amp; more</p>
          </div>
          <ChevronRight size={14} className={`${iconCl} ml-auto flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
        </a>
        <a
          href={CHURCH.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors group"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/25">
            <MessageCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">WhatsApp Community</p>
            <p className={`text-[11px] ${muted}`}>Join the church group</p>
          </div>
          <ChevronRight size={14} className="text-emerald-500 ml-auto flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>
        <Link
          href="/dashboard/prayer-requests"
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors group"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/25">
            <Heart size={15} className="text-violet-600 dark:text-violet-400" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">Prayer Wall</p>
            <p className={`text-[11px] ${muted}`}>Share a request or pray for others</p>
          </div>
          <ChevronRight size={14} className="text-violet-500 ml-auto flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </PanelCard>
  );
}

// ── Band 3: Onboarding Checklist ──────────────────────────────────────────────

function OnboardingChecklist({ member, attendanceCount, prayerCount, ministryUnit }: {
  member: MemberHomeProps["member"];
  attendanceCount: number;
  prayerCount: number;
  ministryUnit?: MemberHomeProps["ministryUnit"];
}) {
  // Profile completion meter
  const profileFields = [member?.bio, member?.phone, member?.dateOfBirth, member?.address, member?.photoUrl];
  const filledFields = profileFields.filter(Boolean).length;
  const profilePct = Math.round((filledFields / profileFields.length) * 100);
  const profileComplete = profilePct >= 60;

  const steps = [
    { label: "Complete your profile",           desc: "Add your bio, phone number, and date of birth.", done: profileComplete,  href: "/dashboard/profile" },
    { label: "Join a ministry unit",             desc: "Connect with a team that fits your calling.",    done: !!ministryUnit,   href: "#" },
    { label: "Submit your first prayer request", desc: "Our team is ready to pray with you.",            done: prayerCount > 0, href: "/dashboard/prayer-requests" },
  ];

  const done = steps.filter((s) => s.done).length;

  return (
    <PanelCard
      kicker="My Journey"
      title="Getting Started"
      icon={ListChecks}
      action={
        <span className={`text-xs font-bold ${muted} tabular-nums`}>{done}/{steps.length}</span>
      }
    >
      {/* Progress track */}
      <div className="h-1.5 rounded-full bg-[#E7CDD3]/50 dark:bg-white/[0.07] mb-6 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#87102C]"
          initial={{ width: 0 }}
          animate={{ width: `${(done / steps.length) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-3.5 rounded-2xl px-4 py-3.5 transition-colors ${
              step.done
                ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20"
                : "bg-gray-50 dark:bg-white/[0.03] border border-[#E7CDD3]/50 dark:border-white/[0.07]"
            }`}
          >
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              step.done ? "bg-emerald-500" : "bg-[#E7CDD3]/60 dark:bg-white/10"
            }`}>
              {step.done && <CheckCircle2 size={13} className="text-white" strokeWidth={2.5} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold leading-snug ${
                step.done ? "line-through text-emerald-600 dark:text-emerald-400" : "text-[#111] dark:text-white"
              }`}>
                {step.label}
              </p>
              {!step.done && (
                <p className={`text-[11px] ${muted} mt-0.5 leading-relaxed`}>{step.desc}</p>
              )}
            </div>
            {!step.done && (
              <Link href={step.href} className={`${linkCl} mt-0.5`}>
                Go <ChevronRight size={11} />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Profile completion sub-meter */}
      {profilePct < 100 && (
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
      )}

      {/* Pastoral welcome — only for truly new members (nothing done yet) */}
      {done === 0 && (
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
      )}

      {done === steps.length && (
        <div className="mt-5 p-4 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30 text-center">
          <p className="text-sm font-bold text-[#87102C] dark:text-[#FFB3C1]">🎉 You&apos;re all set!</p>
          <p className={`text-xs ${muted} mt-0.5`}>Welcome to the Everlasting Hills family.</p>
        </div>
      )}
    </PanelCard>
  );
}

// ── Band 3: Warm Stats ────────────────────────────────────────────────────────

function WarmAttendanceStat({ attendanceRate, attendanceCount, lastServiceDate, recentServices }: {
  attendanceRate: number;
  attendanceCount: number;
  lastServiceDate: string | null;
  recentServices: MemberHomeProps["recentServices"];
}) {
  const standing = standingLabel(attendanceRate);

  const sundaysAttended = recentServices.filter(
    (s) => new Date(s.scheduledAt).getDay() === 0
  ).length;
  const sundayNarrative = sundaysAttended > 0
    ? `You attended ${sundaysAttended} of the last 6 Sundays`
    : null;

  const daysSinceLast = lastServiceDate
    ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / 86_400_000)
    : null;

  return (
    <section className={card}>
      <div className={`${hdrBdr} px-5 py-4`}>
        <p className={kicker}>My Journey</p>
        <h3 className={cardTitle}>Attendance</h3>
      </div>
      <div className="flex-1 p-5 flex flex-col items-center gap-3 text-center">
        {/* Large ring with % inside */}
        <div className="relative my-1">
          <CircleProgress value={attendanceRate} size={88} />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xl font-black text-[#111] dark:text-white leading-none">
              {attendanceRate}<span className="text-xs font-bold">%</span>
            </p>
          </div>
        </div>
        <div className="space-y-0.5">
          <p className={`text-xs ${muted} leading-relaxed`}>
            {attendanceCount > 0
              ? `${attendanceCount} service${attendanceCount !== 1 ? "s" : ""} attended`
              : "No attendance recorded yet"}
          </p>
          {sundayNarrative && (
            <p className={`text-[11px] ${muted} opacity-80`}>{sundayNarrative}</p>
          )}
          {daysSinceLast !== null && daysSinceLast <= 60 && (
            <p className={`text-[11px] ${muted} opacity-70`}>
              Last here {daysSinceLast === 0 ? "today" : daysSinceLast === 1 ? "yesterday" : `${daysSinceLast} days ago`}
            </p>
          )}
          <p className={`text-[11px] font-semibold mt-1 ${standing.color}`}>{standing.text}</p>
        </div>
      </div>
    </section>
  );
}

function WarmStreakStat({ streakWeeks, nextService, ministryUnit }: {
  streakWeeks: number;
  nextService: MemberHomeProps["nextService"];
  ministryUnit?: MemberHomeProps["ministryUnit"];
}) {
  const streak = streakLabel(streakWeeks);

  const milestones = [
    { wks: 4,  label: "4-Week Faithful",  color: "text-sky-600 dark:text-sky-400",    bg: "bg-sky-50 dark:bg-sky-500/10",    border: "border-sky-200/60 dark:border-sky-500/20" },
    { wks: 8,  label: "8-Week Committed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200/60 dark:border-emerald-500/20" },
    { wks: 12, label: "12-Week Champion", color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-200/60 dark:border-amber-500/20" },
  ];
  const earnedMilestone = [...milestones].reverse().find((m) => streakWeeks >= m.wks);

  return (
    <section className={card}>
      <div className={`${hdrBdr} px-5 py-4`}>
        <p className={kicker}>My Journey</p>
        <h3 className={cardTitle}>Streak</h3>
      </div>
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-3xl font-black text-[#111] dark:text-white leading-none">
              {streakWeeks}<span className="text-base font-bold ml-1">Wk{streakWeeks !== 1 ? "s" : ""}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${streak.dot}`} />
              <p className={`text-[11px] font-semibold ${muted}`}>{streak.text}</p>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200/60 dark:border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-amber-500" />
          </div>
        </div>

        {earnedMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border ${earnedMilestone.bg} ${earnedMilestone.border}`}
          >
            <Award size={16} className={earnedMilestone.color} />
            <p className={`text-[11px] font-bold ${earnedMilestone.color}`}>{earnedMilestone.label}</p>
            <Star size={10} className={`ml-auto ${earnedMilestone.color} opacity-60`} fill="currentColor" />
          </motion.div>
        )}

        {(ministryUnit?.nextServingDate || nextService) && (
          <div className="pt-4 border-t border-[#E7CDD3]/50 dark:border-white/[0.07]">
            {ministryUnit?.nextServingDate ? (
              <>
                <p className={`${kicker} mb-1`}>Serving Next</p>
                <p className="text-xs font-semibold text-[#111] dark:text-white line-clamp-1">{ministryUnit.name}</p>
                <p className={`text-[11px] ${muted} mt-0.5`}>
                  {fmtDate(ministryUnit.nextServingDate, { weekday: "short", day: "numeric", month: "short" })}
                </p>
              </>
            ) : nextService ? (
              <>
                <p className={`${kicker} mb-1`}>Next Service</p>
                <p className="text-xs font-semibold text-[#111] dark:text-white line-clamp-1">{nextService.name}</p>
                <p className={`text-[11px] ${muted} mt-0.5`}>
                  {fmtDate(nextService.scheduledAt, { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}{fmtTime(nextService.scheduledAt)}
                </p>
              </>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Band 3: Monthly Chart ─────────────────────────────────────────────────────

function MonthlyAttendanceChart({ data }: { data: MemberHomeProps["monthlyAttendance"] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const CHART_H = 88;

  return (
    <PanelCard kicker="Personal" title="Monthly Attendance" icon={TrendingUp}>
      <p className={`text-xs ${muted} mb-4`}>
        Services attended vs. held — last 6 months
      </p>
      <div className="flex items-end justify-between gap-2 px-1" style={{ height: CHART_H + 36 }}>
        {data.map((d, i) => {
          const totalH = Math.max(4, (d.total / maxTotal) * CHART_H);
          const attendedH = d.total > 0 ? (d.attended / d.total) * totalH : 0;
          const pct = d.total > 0 ? Math.round((d.attended / d.total) * 100) : null;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end min-w-0" style={{ height: CHART_H + 36 }}>
              {pct !== null ? (
                <span className={`text-[9px] font-semibold ${muted} tabular-nums`}>{pct}%</span>
              ) : (
                <span className={`text-[9px] ${muted}`}>—</span>
              )}
              <div className="w-full rounded-t relative overflow-hidden bg-[#E7CDD3]/50 dark:bg-white/[0.07]" style={{ height: `${totalH}px` }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t transition-all duration-700"
                  style={{ height: `${attendedH}px`, backgroundColor: "#87102C", opacity: 0.85 }}
                />
              </div>
              <span className={`text-[9px] ${muted} text-center truncate w-full`}>{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-[#8a7e80] dark:text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#87102C] opacity-80" />
          Attended
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#E7CDD3]/70 dark:bg-white/10" />
          Total services
        </span>
      </div>
    </PanelCard>
  );
}

// ── Band 3: Discipleship Tracker ─────────────────────────────────────────────

function DiscipleshipTrackerCard({ milestones }: {
  milestones: MemberHomeProps["discipleshipMilestones"];
}) {
  const defaultItems: Array<{ label: string; completedAt: string | null }> = [
    { label: "Water Baptism", completedAt: null },
    { label: "Membership Class", completedAt: null },
    { label: "Leadership Training", completedAt: null },
  ];
  const items = (milestones && milestones.length > 0) ? milestones : defaultItems;
  const doneCount = items.filter((m) => m.completedAt).length;

  return (
    <PanelCard
      kicker="Discipleship"
      title="Growth Milestones"
      icon={Award}
      action={<span className={`text-xs font-bold ${muted} tabular-nums`}>{doneCount}/{items.length}</span>}
    >
      <div className="h-1.5 rounded-full bg-[#E7CDD3]/50 dark:bg-white/[0.07] mb-5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / items.length) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
      <div className="space-y-2.5">
        {items.map((m, i) => (
          <div
            key={i}
            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border ${
              m.completedAt
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20"
                : "bg-gray-50 dark:bg-white/[0.03] border-[#E7CDD3]/50 dark:border-white/[0.07]"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.completedAt ? "bg-emerald-500" : "bg-[#E7CDD3]/60 dark:bg-white/10"
            }`}>
              {m.completedAt
                ? <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />
                : <span className="text-[10px] font-bold text-[#8a7e80] dark:text-white/40">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${m.completedAt ? "text-emerald-700 dark:text-emerald-400" : "text-[#111] dark:text-white"}`}>
                {m.label}
              </p>
              {m.completedAt && (
                <p className={`text-[10px] ${muted}`}>Completed {fmtShortDate(m.completedAt)}</p>
              )}
            </div>
            {!m.completedAt && (
              <span className={`text-[11px] font-medium ${muted} flex-shrink-0`}>Pending</span>
            )}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

// ── Band 4: Community Feed ────────────────────────────────────────────────────

function CommunityFeedPanel({
  feed, onlineCount,
}: {
  feed: MemberHomeProps["communityFeed"];
  onlineCount?: number | null;
}) {
  const items = feed ?? [];
  return (
    <PanelCard
      kicker="Community"
      title="Church Feed"
      icon={Users}
      action={<Link href="/dashboard" className={linkCl}>View all <ChevronRight size={12} /></Link>}
    >
      {onlineCount != null && onlineCount > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {onlineCount} member{onlineCount !== 1 ? "s" : ""} online now
          </p>
        </div>
      )}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <span className={`${iconBg} !w-11 !h-11 !rounded-2xl`}>
            <MessageCircle size={18} className={iconCl} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No posts yet</p>
            <p className={`text-xs ${muted} mt-0.5`}>Community activity will appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.slice(0, 3).map((post) => {
            const postInitials = post.authorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div key={post.id} className="flex gap-3 pb-4 border-b border-[#E7CDD3]/50 dark:border-white/[0.06] last:border-0 last:pb-0">
                {post.authorPhotoUrl ? (
                  <img src={post.authorPhotoUrl} alt={post.authorName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#87102C] dark:text-[#FFB3C1]">
                    {postInitials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-xs font-semibold text-[#111] dark:text-white truncate">{post.authorName}</p>
                    <p className={`text-[10px] ${muted} flex-shrink-0`}>{relativeTime(post.createdAt)}</p>
                  </div>
                  <p className={`text-xs ${muted} mt-0.5 leading-relaxed line-clamp-2`}>{post.text}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Heart size={11} className="text-rose-400" fill="currentColor" />
                    <span className={`text-[10px] ${muted}`}>{post.reactions}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

// ── Band 4: Announcements ─────────────────────────────────────────────────────

function AnnouncementsPanel({ announcements, featuredSermon, communityBirthdays = [] }: {
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
  featuredSermon: MemberHomeProps["featuredSermon"];
  communityBirthdays?: MemberHomeProps["communityBirthdays"];
}) {
  return (
    <PanelCard
      kicker="Community"
      title="Announcements"
      icon={Bell}
      action={announcements.length > 0 ? (
        <span className={`${linkCl} cursor-default`}>
          {announcements.length} total <ChevronRight size={12} />
        </span>
      ) : undefined}
    >
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
          <span className={`${iconBg} !w-12 !h-12 !rounded-2xl`}>
            <Bell size={20} className={iconCl} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No announcements yet</p>
            {(communityBirthdays?.length ?? 0) > 0 ? (
              <p className={`text-xs ${muted} mt-1`}>
                While you&apos;re here — {communityBirthdays![0].firstName} {communityBirthdays![0].lastName} has a birthday today! 🎂
              </p>
            ) : featuredSermon ? (
              <p className={`text-xs ${muted} mt-1`}>
                While you&apos;re here,{" "}
                <Link href={`/sermons/${featuredSermon.slug}`} className="text-[#87102C] dark:text-[#FFB3C1] hover:underline font-semibold">
                  listen to this week&apos;s sermon
                </Link>
              </p>
            ) : (
              <p className={`text-xs ${muted} mt-1`}>Church updates will appear here</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="flex gap-3.5 pb-4 border-b border-[#E7CDD3]/50 dark:border-white/[0.06] last:border-0 last:pb-0">
              {/* Accent rule */}
              <div className="w-0.5 rounded-full bg-[#87102C]/30 dark:bg-[#FFB3C1]/20 flex-shrink-0 self-stretch" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111] dark:text-white leading-snug">{a.title}</p>
                <p className={`text-xs ${muted} mt-1 leading-relaxed line-clamp-3`}>{a.body}</p>
                <p className={`text-[10px] ${muted} opacity-70 mt-1.5`}>{relativeTime(a.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

// ── Band 4: Community Birthdays ───────────────────────────────────────────────

function CommunityBirthdayPanel({ communityBirthdays }: {
  communityBirthdays: Array<{ firstName: string; lastName: string; photoUrl: string | null }>;
}) {
  return (
    <PanelCard kicker="Celebrations" title="Birthdays Today" icon={Gift}>
      {communityBirthdays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200/50 dark:border-rose-500/20">
            <Gift size={20} className="text-rose-400 dark:text-rose-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No birthdays today</p>
            <p className={`text-xs ${muted} mt-1`}>Check back daily to celebrate the family</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {communityBirthdays.slice(0, 5).map((b, i) => {
            const initials = `${b.firstName[0]}${b.lastName[0]}`.toUpperCase();
            return (
              <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/15">
                {b.photoUrl ? (
                  <img src={b.photoUrl} alt={`${b.firstName} ${b.lastName}`}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0 ring-2 ring-rose-200 dark:ring-rose-500/30" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#87102C] dark:text-[#FFB3C1]">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate">
                    🎂 {b.firstName} {b.lastName}
                  </p>
                  <p className="text-[10px] text-rose-400 dark:text-rose-500 mt-0.5">Birthday today</p>
                </div>
                <a href={CHURCH.whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5">
                  Wish <ChevronRight size={11} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

// ── Band 5: Featured Sermon ───────────────────────────────────────────────────

function FeaturedSermonCard({ sermon }: {
  sermon: NonNullable<MemberHomeProps["featuredSermon"]>;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { void audioRef.current.play(); setPlaying(true); }
  }

  return (
    <section className={card}>
      <div className={`flex items-center justify-between gap-3 ${hdrBdr} px-5 py-4 sm:px-6`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={iconBg}>
            <Mic size={15} className={iconCl} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={kicker}>This Week</p>
            <h3 className={`${cardTitle} truncate`}>Featured Sermon</h3>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/25 px-2.5 py-1 rounded-full uppercase tracking-wide">
          Featured
        </span>
      </div>

      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-full sm:w-52">
          {sermon.thumbnailUrl ? (
            <img src={sermon.thumbnailUrl} alt={sermon.title}
              className="w-full sm:w-52 aspect-video rounded-xl object-cover" />
          ) : (
            <div className="w-full sm:w-52 aspect-video rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center">
              <BookOpen size={28} className={iconCl} />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-base font-bold text-[#111] dark:text-white leading-snug">{sermon.title}</p>
            <p className={`text-xs ${muted} mt-1`}>
              {sermon.speaker} · {fmtDate(sermon.date, { day: "numeric", month: "long", year: "numeric" })}
            </p>
            {sermon.description && (
              <p className={`text-xs ${muted} mt-2.5 leading-relaxed line-clamp-3`}>
                {sermon.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sermon.audioUrl ? (
              <>
                <audio ref={audioRef} src={sermon.audioUrl} onEnded={() => setPlaying(false)} />
                <button
                  type="button"
                  onClick={togglePlay}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-xs font-semibold hover:bg-[#6E0C24] hover:-translate-y-0.5 transition-all shadow-sm shadow-[#87102C]/20"
                >
                  {playing ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                  {playing ? "Pause" : "Play"}
                </button>
              </>
            ) : null}
            <Link href={`/sermons/${sermon.slug}`}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold hover:-translate-y-0.5 transition-all w-fit ${
                sermon.audioUrl
                  ? "bg-gray-100 dark:bg-white/10 text-[#111] dark:text-white hover:bg-gray-200 dark:hover:bg-white/15"
                  : "bg-[#87102C] text-white hover:bg-[#6E0C24] shadow-sm shadow-[#87102C]/20"
              }`}
            >
              <BookOpen size={12} />
              {sermon.audioUrl ? "Full sermon" : "Listen now"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Band 5: Sermon Library ────────────────────────────────────────────────────

function SermonLibraryCard({ sermonStreak, bookmarks }: {
  sermonStreak: number;
  bookmarks: MemberHomeProps["bookmarks"];
}) {
  return (
    <PanelCard
      kicker="My Library"
      title="Saved Sermons"
      icon={Bookmark}
      action={
        <Link href="/sermons" className={linkCl}>Browse <ChevronRight size={12} /></Link>
      }
    >
      {sermonStreak > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
          <span className="text-2xl" aria-hidden="true">🔥</span>
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {sermonStreak}-week listening streak!
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 mt-0.5">
              Listen to a new sermon this week to keep it going.
            </p>
          </div>
        </div>
      )}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <span className={`${iconBg} !w-11 !h-11 !rounded-xl`}>
            <Bookmark size={18} className={iconCl} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No saved sermons yet</p>
            <Link href="/sermons" className={`${linkCl} justify-center mt-1`}>
              Browse the archive <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {bookmarks.slice(0, 5).map((b) => (
            <Link key={b.slug} href={`/sermons/${b.slug}`}
              className="flex gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition-colors group">
              {b.thumbnailUrl ? (
                <img src={b.thumbnailUrl} alt={b.title} className="w-12 aspect-video rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 aspect-video rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={12} className={iconCl} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111] dark:text-white group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] transition-colors line-clamp-1">{b.title}</p>
                <p className={`text-[10px] ${muted} mt-0.5`}>{b.speaker} · {fmtShortDate(b.date)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

// ── Band 5: Continue Listening ────────────────────────────────────────────────

function ContinueListeningCard({ listenHistory }: {
  listenHistory: MemberHomeProps["listenHistory"];
}) {
  return (
    <PanelCard
      kicker="Content"
      title="Continue Listening"
      icon={Headphones}
      action={
        <Link href="/sermons" className={linkCl}>All sermons <ChevronRight size={12} /></Link>
      }
    >
      {listenHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <span className={`${iconBg} !w-11 !h-11 !rounded-xl`}>
            <Headphones size={18} className={iconCl} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No listening history yet</p>
            <Link href="/sermons" className={`${linkCl} justify-center mt-1`}>
              Start listening <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {listenHistory.slice(0, 5).map((p) => {
            const pct = p.audioDuration && p.audioDuration > 0
              ? Math.min(100, Math.round((p.positionSec / p.audioDuration) * 100))
              : null;
            return (
              <Link key={p.slug} href={`/sermons/${p.slug}`}
                className="flex gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition-colors group">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.title} className="w-12 aspect-video rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 aspect-video rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                    <Play size={12} className={iconCl} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#111] dark:text-white group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] transition-colors line-clamp-1">{p.title}</p>
                  <p className={`text-[10px] ${muted} mt-0.5`}>{p.speaker} · {fmtShortDate(p.date)}</p>
                  {pct !== null && !p.completed && (
                    <div className="mt-1.5 h-1 rounded-full bg-[#E7CDD3]/50 dark:bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full bg-[#87102C]" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  {p.completed && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Completed ✓
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

// ── Profile Edit Card ─────────────────────────────────────────────────────────

function ProfileEditCard({ member, initials }: {
  member: NonNullable<MemberHomeProps["member"]>;
  initials: string;
}) {
  const [photo] = useState(member.photoUrl ?? "");
  const [bio, setBio] = useState(member.bio ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [address, setAddress] = useState(member.address ?? "");
  const [dob, setDob] = useState(member.dateOfBirth ?? "");
  const [uploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("Profile photo upload is coming soon. Please reach out to an admin to update your photo.");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    setTimeout(() => {
      setError("Profile editing is coming soon. Please reach out to an admin for now.");
      setSaving(false);
    }, 400);
  }

  const inputCls = "w-full text-sm rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-gray-50 dark:bg-white/[0.04] text-[#111] dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-[#8a7e80] dark:placeholder:text-white/25";
  const labelCls = `block text-xs font-semibold ${muted} mb-1.5`;

  return (
    <PanelCard kicker="Settings" title="My Profile" icon={User}>
      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group flex-shrink-0">
            {photo ? (
              <img src={photo} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#E7CDD3]/60 dark:ring-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center text-xl font-bold text-[#87102C] dark:text-[#FFB3C1] ring-2 ring-[#E7CDD3]/60 dark:ring-white/10">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera size={16} className="text-white" />}
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploading} />
          </label>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#111] dark:text-white">{member.firstName} {member.lastName}</p>
            <p className={`text-xs ${muted}`}>{member.email}</p>
            <p className={`text-[11px] ${muted} opacity-70 mt-0.5`}>Click avatar to upload · Max 2 MB</p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className={labelCls}>About Me</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500}
            placeholder="Share a little about yourself…" className={`${inputCls} resize-none`} />
          <p className={`text-[10px] ${muted} mt-0.5 text-right`}>{bio.length}/500</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Your home address" className={inputCls} />
        </div>

        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all shadow-sm shadow-[#87102C]/20">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Saved!</p>}
        </div>
      </form>
    </PanelCard>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MemberHome(props: MemberHomePropsOptional) {
  const {
    member = null,
    userEmail = "",
    memberDisplayId = "EHC-NEW",
    attendanceRate = 0,
    attendanceCount = 0,
    streakWeeks = 0,
    lastServiceDate = null,
    nextService = null,
    hasCheckedInToday = false,
    todayService = null,
    prayerCount = 0,
    recentServices = [],
    monthlyAttendance = [],
    birthdayDaysUntil = null,
    sermonStreak = 0,
    bookmarks = [],
    listenHistory = [],
    announcements = [],
    communityBirthdays = [],
    ministryUnit = null,
    featuredSermon = null,
    pastorWord = null,
    dailyPrayer = null,
    communityFeed = [],
    onlineCount = null,
    discipleshipMilestones = [],
    memberSince = null,
    anniversaryDaysUntil = null,
  } = props;

  const displayName = member ? `${member.firstName} ${member.lastName}` : userEmail;
  const firstName = member?.firstName ?? displayName.split(" ")[0];
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : (userEmail[0] ?? "M").toUpperCase();

  const effectiveTodayService = DEV_ALWAYS_SHOW_CHECKIN
    ? todayService ?? { id: "dev-preview", name: "Today's Service" }
    : todayService;
  const isServiceDay = !!effectiveTodayService;
  const isNewMember = attendanceCount === 0 && prayerCount === 0;

  const [qrBanner, setQrBanner] = useState<{
    type: "success" | "already" | "error" | "invalid";
    service?: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qr = params.get("qr");
    if (!qr) return;
    const service = params.get("service") ?? undefined;
    if (qr === "success" || qr === "already" || qr === "error" || qr === "invalid") {
      setQrBanner({ type: qr, service });
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return (
    <div className="space-y-5 max-w-6xl">

      {/* QR Check-in Result Banner */}
      {qrBanner && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-medium ${
          qrBanner.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            : qrBanner.type === "already"
            ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200/60 dark:border-sky-500/20 text-sky-700 dark:text-sky-400"
            : "bg-red-50 dark:bg-red-500/10 border-red-200/60 dark:border-red-500/20 text-red-700 dark:text-red-400"
        }`}>
          <span className="text-lg flex-shrink-0">
            {qrBanner.type === "success" ? "✅" : qrBanner.type === "already" ? "ℹ️" : "❌"}
          </span>
          <span className="flex-1">
            {qrBanner.type === "success"
              ? `Checked in to ${qrBanner.service ?? "service"} successfully!`
              : qrBanner.type === "already"
              ? `You already checked in to ${qrBanner.service ?? "this service"}.`
              : "QR check-in failed. Please try again or contact the admin."}
          </span>
          <button type="button" onClick={() => setQrBanner(null)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BAND 1 — PASTORAL WELCOME
          ═══════════════════════════════════════════════════════════ */}

      <WelcomeHero
        firstName={firstName}
        initials={initials}
        photoUrl={member?.photoUrl ?? null}
        memberDisplayId={memberDisplayId}
        attendanceRate={attendanceRate}
        streakWeeks={streakWeeks}
        nextService={nextService}
      />

      {birthdayDaysUntil !== null && (
        <BirthdayBanner firstName={firstName} daysUntil={birthdayDaysUntil} />
      )}

      {anniversaryDaysUntil !== null && memberSince && (
        <AnniversaryBanner firstName={firstName} memberSince={memberSince} daysUntil={anniversaryDaysUntil} />
      )}

      <ScriptureCard />
      <PastorWordCard pastorWord={pastorWord} />
      <QuickActionsStrip />

      {/* ═══════════════════════════════════════════════════════════
          BAND 2 — TODAY
          ═══════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CheckInPanel
          todayService={todayService}
          hasCheckedInToday={hasCheckedInToday}
          nextService={nextService}
        />
        <TodayInfoPanel
          nextService={nextService}
          isServiceDay={isServiceDay}
          hasCheckedIn={hasCheckedInToday}
          featuredSermon={featuredSermon}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BAND 3 — MY JOURNEY
          ═══════════════════════════════════════════════════════════ */}

      {isNewMember ? (
        <OnboardingChecklist
          member={member}
          attendanceCount={attendanceCount}
          prayerCount={prayerCount}
          ministryUnit={ministryUnit}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5">
            <WarmAttendanceStat
              attendanceRate={attendanceRate}
              attendanceCount={attendanceCount}
              lastServiceDate={lastServiceDate}
              recentServices={recentServices}
            />
            <WarmStreakStat
              streakWeeks={streakWeeks}
              nextService={nextService}
              ministryUnit={ministryUnit}
            />
          </div>

          <DiscipleshipTrackerCard milestones={discipleshipMilestones} />

          {monthlyAttendance.some((m) => m.total > 0) && (
            <MonthlyAttendanceChart data={monthlyAttendance} />
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BAND 4 — COMMUNITY
          ═══════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnnouncementsPanel announcements={announcements} featuredSermon={featuredSermon} communityBirthdays={communityBirthdays} />
        <CommunityBirthdayPanel communityBirthdays={communityBirthdays} />
      </div>

      <CommunityFeedPanel feed={communityFeed} onlineCount={onlineCount} />

      {/* ═══════════════════════════════════════════════════════════
          BAND 5 — CONTENT
          ═══════════════════════════════════════════════════════════ */}

      {featuredSermon && <FeaturedSermonCard sermon={featuredSermon} />}

      {(sermonStreak > 0 || bookmarks.length > 0 || listenHistory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SermonLibraryCard sermonStreak={sermonStreak} bookmarks={bookmarks} />
          <ContinueListeningCard listenHistory={listenHistory} />
        </div>
      )}

    </div>
  );
}
