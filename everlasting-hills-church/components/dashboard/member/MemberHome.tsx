"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Heart, Clock, Calendar, CheckCircle2,
  BookOpen, Sparkles, Bell, ChevronRight, TrendingUp,
  User, Camera, Headphones, Bookmark, Play,
  Hand, Youtube, MessageCircle,
} from "lucide-react";
import { CHURCH } from "@/config/config";
// Dummy fallback removed — empty/zero defaults below activate the component's intrinsic
// empty-state branches instead of showing misleading fake data.
// (The DummyData export still exists for Storybook-style previews if needed.)

/**
 * DEV-ONLY: force the attendance/check-in panel to render its live UI on every
 * weekday so the design can be iterated without waiting for Sunday. Set back to
 * `false` once the UI work is done — production should gate on actual service days.
 */
const DEV_ALWAYS_SHOW_CHECKIN = true;

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
  todayService: { id: string; name: string } | null;
  prayerCount: number;
  recentServices: Array<{ name: string; scheduledAt: string; totalAttended: number }>;
  monthlyAttendance: Array<{ label: string; attended: number; total: number }>;
  birthdayDaysUntil: number | null;
  sermonStreak: number;
  bookmarks: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioUrl: string | null }>;
  listenHistory: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; positionSec: number; completed: boolean; audioDuration: number | null }>;
}

// All props optional: when omitted, the component falls back to bundled dummy
// data so it renders standalone for preview. Pass real props in production.
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
  if (rate > 0)   return { text: "Needs Improvement", color: "text-red-600 dark:text-red-400"      };
  return            { text: "No records yet",          color: "text-gray-400"                       };
}

function streakLabel(weeks: number): { text: string; dot: string } {
  if (weeks >= 8) return { text: "Consistent level", dot: "bg-purple-500" };
  if (weeks >= 4) return { text: "Firm level",        dot: "bg-emerald-500" };
  if (weeks >= 2) return { text: "Building level",    dot: "bg-sky-500"    };
  if (weeks === 1) return { text: "Starting level",   dot: "bg-amber-500"  };
  return             { text: "No streak yet",         dot: "bg-gray-400"   };
}

// ── Circular Progress ─────────────────────────────────────────────────────────

function CircleProgress({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5"
        className="stroke-gray-200 dark:stroke-white/10" />
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5"
        stroke="#87102C" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 20 20)" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, iconEl, children,
}: { title: string; iconEl: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {title}
        </span>
        <div className="text-gray-400 dark:text-gray-500 mt-0.5">{iconEl}</div>
      </div>
      {children}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({
  title, iconEl, action, children,
}: { title: string; iconEl: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
            <div className="text-[#87102C]">{iconEl}</div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Check-in Panel ────────────────────────────────────────────────────────────

function CheckInPanel({
  todayService, hasCheckedInToday,
}: { todayService: MemberHomeProps["todayService"]; hasCheckedInToday: boolean }) {
  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveTodayService = DEV_ALWAYS_SHOW_CHECKIN
    ? todayService ?? { id: "dev-preview", name: "Today's Service" }
    : todayService;

  async function handleCheckIn() {
    setLoading(true);
    setError("");
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

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0610] via-[#0e0407] to-[#1a0610] border border-white/8 min-h-[440px] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      {/* Constellation background — grid + glowing dots */}
      <CosmicBackdrop />

      <div className="relative z-10 flex flex-col h-full p-7 sm:p-8">
        {/* Top-left eyebrow + name */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#FFB3C1]/80">
            Today's Service
          </p>
          <h2 className="text-white text-xl sm:text-2xl font-bold mt-1.5">{serviceName}.</h2>
          <div className="h-px w-12 bg-white/20 mt-3" />
        </div>

        {/* Center stage — varies by state */}
        <div className="flex-1 flex items-center justify-center py-6">
          {checkedIn ? (
            <CheckedInCenter />
          ) : isServiceDay ? (
            <ServiceDayCenter onClick={handleCheckIn} loading={loading} />
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

/* ── Cosmic backdrop: grid lines + breathing constellation dots ─────────────── */
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
      {/* Faint grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Soft radial glows in corners */}
      <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#87102C]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-16 w-72 h-72 rounded-full bg-amber-300/8 blur-3xl pointer-events-none" />
      {/* Constellation dots, each breathing on its own timer */}
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

/* ── Service-day center: breathing/vibrating hand button ────────────────────── */
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
        {/* Three expanding pulse rings — staggered for a continuous bloom */}
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

        {/* The hand — breathing scale + soft float + micro-vibration */}
        <motion.span
          className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#a32242] via-[#87102C] to-[#5d091f] shadow-[0_20px_60px_rgba(135,16,44,0.55)] border border-white/10"
          animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Inner sheen */}
          <span
            aria-hidden="true"
            className="absolute inset-1 rounded-full bg-gradient-to-br from-white/15 to-transparent pointer-events-none"
          />
          {/* Vibrating hand */}
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
          One gesture is all it takes. God's house, marked with your name.
        </p>
      </div>
    </div>
  );
}

/* ── No-service center: empty state with comms CTAs ─────────────────────────── */
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

/* ── Already-checked-in success state ───────────────────────────────────────── */
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

// ── Announcements Panel ───────────────────────────────────────────────────────

function AnnouncementsPanel() {
  return (
    <SectionCard
      title="Community Announcements"
      iconEl={<Bell size={14} />}
      action={
        <span className="text-xs text-[#87102C] dark:text-[#e8768a] font-medium flex items-center gap-1 cursor-default">
          All Announcements <ChevronRight size={12} />
        </span>
      }
    >
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
          <Bell size={18} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No announcements yet</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
          Church announcements will appear here
        </p>
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-white/8 mt-2">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Everlasting Hills Communication Desk · Ibadan, NG
        </p>
      </div>
    </SectionCard>
  );
}

// ── Attendance Chart ──────────────────────────────────────────────────────────

function AttendanceChart({ services }: { services: MemberHomeProps["recentServices"] }) {
  const max = Math.max(...services.map((s) => s.totalAttended), 1);

  return (
    <SectionCard title="Recent Service Attendance Peaks" iconEl={<TrendingUp size={14} />}>
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp size={24} className="text-gray-200 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No service data yet</p>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
            Total members checked in per service
          </p>
          <div className="flex items-end gap-3 h-24 mb-3">
            {services.map((s, i) => {
              const pct = Math.max(8, (s.totalAttended / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {s.totalAttended}
                  </span>
                  <div className="w-full flex items-end gap-0.5" style={{ height: "72px" }}>
                    {/* Background bar */}
                    <div
                      className="flex-1 rounded-t bg-gray-100 dark:bg-white/10"
                      style={{ height: "100%" }}
                    />
                    {/* Attendance bar */}
                    <div
                      className="flex-1 rounded-t bg-[#87102C] opacity-80"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight">
                    {fmtShortDate(s.scheduledAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </SectionCard>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ services, prayerCount }: {
  services: MemberHomeProps["recentServices"];
  prayerCount: number;
}) {
  const items = [
    ...services.map((s) => ({
      time: relativeTime(s.scheduledAt),
      text: `${s.totalAttended} member${s.totalAttended !== 1 ? "s" : ""} attended ${s.name}`,
      date: s.scheduledAt,
    })),
  ];

  if (prayerCount > 0) {
    items.push({
      time: "On record",
      text: `${prayerCount} prayer request${prayerCount !== 1 ? "s" : ""} submitted to the church`,
      date: new Date().toISOString(),
    });
  }

  return (
    <SectionCard title="Recent Platform Actions" iconEl={<Sparkles size={14} />}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles size={24} className="text-gray-200 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#87102C] mt-1" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                  {item.time}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/8">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Ibadan Diocese Council Oversight Group
        </p>
      </div>
    </SectionCard>
  );
}

// ── Profile Edit Card ─────────────────────────────────────────────────────────

function ProfileEditCard({ member, initials }: {
  member: NonNullable<MemberHomeProps["member"]>;
  initials: string;
}) {
  const [photo, setPhoto] = useState(member.photoUrl ?? "");
  const [bio, setBio] = useState(member.bio ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [address, setAddress] = useState(member.address ?? "");
  const [dob, setDob] = useState(member.dateOfBirth ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO(backend): /members/me/avatar endpoint not implemented yet — file is staged but not uploaded.
    setError("Profile photo upload is coming soon. Please reach out to an admin to update your photo.");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    // TODO(backend): /members/me PATCH endpoint not implemented yet.
    setTimeout(() => {
      setError("Profile editing is coming soon. Please reach out to an admin for now.");
      setSaving(false);
    }, 400);
  }

  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/8">
        <div className="w-7 h-7 rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
          <User size={14} className="text-[#87102C]" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">My Profile</h3>
      </div>

      <form onSubmit={handleSave} className="p-5 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group flex-shrink-0">
            {photo ? (
              <img src={photo} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center text-xl font-bold text-[#87102C] dark:text-[#e8768a] ring-2 ring-gray-200 dark:ring-white/10">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploading} />
          </label>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{member.firstName} {member.lastName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Click avatar to upload photo · Max 2 MB</p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">About Me</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Share a little about yourself…"
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 text-right">{bio.length}/500</p>
        </div>

        {/* Phone + DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your home address"
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>

        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Saved!</p>}
        </div>
      </form>
    </div>
  );
}

// ── Monthly Attendance Chart ──────────────────────────────────────────────────

function MonthlyAttendanceChart({ data }: { data: MemberHomeProps["monthlyAttendance"] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const CHART_H = 88;

  return (
    <div>
      <div className="flex items-end justify-between gap-2 px-1" style={{ height: CHART_H + 36 }}>
        {data.map((d, i) => {
          const totalH = Math.max(4, (d.total / maxTotal) * CHART_H);
          const attendedH = d.total > 0 ? (d.attended / d.total) * totalH : 0;
          const pct = d.total > 0 ? Math.round((d.attended / d.total) * 100) : null;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 justify-end min-w-0"
              style={{ height: CHART_H + 36 }}
            >
              {pct !== null ? (
                <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                  {pct}%
                </span>
              ) : (
                <span className="text-[9px] text-gray-300 dark:text-gray-700">—</span>
              )}
              <div
                className="w-full rounded-t relative overflow-hidden bg-gray-200 dark:bg-white/10"
                style={{ height: `${totalH}px` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t transition-all duration-700"
                  style={{ height: `${attendedH}px`, backgroundColor: "#87102C", opacity: 0.85 }}
                />
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center truncate w-full">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#87102C] opacity-80" />
          Attended
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-gray-200 dark:bg-white/10" />
          Total services
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MemberHome(props: MemberHomePropsOptional) {
  /**
   * Defaults are intentionally empty/zero, NOT dummy data. When a section's backend isn't
   * wired yet, the prop is undefined → falls back to these zeros → the component's intrinsic
   * empty-state branches render ("No records yet", "No upcoming service", etc.). Honest UI.
   *
   * Callers should pass real values; pages know what's wired and what's not.
   */
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
  } = props;

  const displayName = member
    ? `${member.firstName} ${member.lastName}`
    : userEmail;

  const firstName = member?.firstName ?? displayName.split(" ")[0];
  const standing = standingLabel(attendanceRate);
  const streak = streakLabel(streakWeeks);
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : (userEmail[0] ?? "M").toUpperCase();

  const [qrBanner, setQrBanner] = useState<{ type: "success" | "already" | "error" | "invalid"; service?: string } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qr = params.get("qr");
    if (!qr) return;
    const service = params.get("service") ?? undefined;
    if (qr === "success" || qr === "already" || qr === "error" || qr === "invalid") {
      setQrBanner({ type: qr, service });
    }
    // Clean URL without reload
    const clean = window.location.pathname;
    window.history.replaceState({}, "", clean);
  }, []);

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── QR Check-in Result ───────────────────────────────────────────── */}
      {qrBanner && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium transition-colors ${
          qrBanner.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            : qrBanner.type === "already"
            ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-400"
            : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
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
          <button type="button" onClick={() => setQrBanner(null)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">👋</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {getGreeting()}, {firstName}!
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              Member ID: {memberDisplayId} · Everlasting Hills Church Family, Ibadan
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System fully operational
        </div>
      </div>

      {/* ── Birthday Banner ─────────────────────────────────────────────── */}
      {birthdayDaysUntil !== null && (
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 border border-pink-200 dark:border-pink-500/20 rounded-xl px-5 py-4 flex items-center gap-4 transition-colors">
          <span className="text-3xl flex-shrink-0">{birthdayDaysUntil === 0 ? "🎂" : "🎉"}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-pink-700 dark:text-pink-300">
              {birthdayDaysUntil === 0
                ? `Happy Birthday, ${firstName}! 🎊`
                : `Your birthday is ${birthdayDaysUntil === 1 ? "tomorrow" : `in ${birthdayDaysUntil} days`}!`}
            </p>
            <p className="text-xs text-pink-500 dark:text-pink-400 mt-0.5">
              {birthdayDaysUntil === 0
                ? "The Everlasting Hills Church family celebrates you today."
                : "Wishing you a wonderful celebration ahead from the EHC family."}
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Attendance */}
        <StatCard title="My Attendance" iconEl={<CircleProgress value={attendanceRate} />}>
          <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
            {attendanceRate}<span className="text-lg font-bold">%</span>
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            Last: {fmtDate(lastServiceDate, { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <p className={`text-[11px] font-semibold mt-0.5 ${standing.color}`}>
            {standing.text}
          </p>
        </StatCard>

        {/* Streak */}
        <StatCard title="Attendance Streak" iconEl={<Zap size={18} />}>
          <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
            {streakWeeks}
            <span className="text-base font-bold ml-1">Wk{streakWeeks !== 1 ? "s" : ""}</span>
          </p>
          {nextService ? (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Next: {new Date(nextService.scheduledAt).toLocaleDateString("en-GB", { weekday: "short" })} {fmtTime(nextService.scheduledAt)}
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">No upcoming service</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${streak.dot}`} />
            <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{streak.text}</p>
          </div>
        </StatCard>

        {/* Prayer Network */}
        <StatCard title="Prayer Network" iconEl={<Heart size={16} />}>
          <p className="text-sm font-black text-gray-900 dark:text-white leading-snug mt-0.5">
            Active Intercessors
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Your active logs: {prayerCount}
          </p>
          <a
            href="/prayer-request"
            className="text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] flex items-center gap-0.5 mt-0.5 hover:underline"
          >
            Submit Request <ChevronRight size={11} />
          </a>
        </StatCard>

        {/* Upcoming Service */}
        <StatCard title="Upcoming Service" iconEl={<Clock size={16} />}>
          {nextService ? (
            <>
              <p className="text-sm font-black text-gray-900 dark:text-white leading-snug mt-0.5 line-clamp-2">
                {nextService.name}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {fmtDate(nextService.scheduledAt, { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {fmtTime(nextService.scheduledAt)} · Hills Auditorium
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                No upcoming service
              </p>
              <p className="text-[11px] text-gray-300 dark:text-gray-600">Check back soon</p>
            </>
          )}
        </StatCard>
      </div>

      {/* ── Check-in + Announcements ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CheckInPanel todayService={todayService} hasCheckedInToday={hasCheckedInToday} />
        <AnnouncementsPanel />
      </div>

      {/* ── Chart + Activity Feed ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceChart services={recentServices} />
        <ActivityFeed services={recentServices} prayerCount={prayerCount} />
      </div>

      {/* ── Personal Analytics ──────────────────────────────────────────── */}
      {monthlyAttendance.some((m) => m.total > 0) && (
        <SectionCard
          title="Your Monthly Attendance"
          iconEl={<TrendingUp size={14} />}
        >
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
            Services attended vs. services held — last 6 months
          </p>
          <MonthlyAttendanceChart data={monthlyAttendance} />
        </SectionCard>
      )}

      {/* ── Sermon Streak + Bookmarks + History ───────────────────────── */}
      {(sermonStreak > 0 || bookmarks.length > 0 || listenHistory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Sermon streak + bookmarks */}
          <SectionCard
            title="My Sermon Library"
            iconEl={<Bookmark size={14} />}
            action={
              <Link href="/sermons" className="text-xs text-[#87102C] dark:text-[#e8768a] font-medium flex items-center gap-1 hover:underline">
                Browse <ChevronRight size={12} />
              </Link>
            }
          >
            {sermonStreak > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    {sermonStreak}-week listening streak!
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Keep it going — listen to a new sermon this week.</p>
                </div>
              </div>
            )}
            {bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Bookmark size={22} className="text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No saved sermons yet</p>
                <Link href="/sermons" className="text-xs text-[#87102C] dark:text-[#e8768a] mt-1 hover:underline">Browse the archive</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bookmarks.slice(0, 5).map((b) => (
                  <Link key={b.slug} href={`/sermons/${b.slug}`}
                    className="flex gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-lg p-1.5 -mx-1.5 transition-colors group">
                    {b.thumbnailUrl ? (
                      <img src={b.thumbnailUrl} alt={b.title} className="w-12 aspect-video rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 aspect-video rounded bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={12} className="text-[#87102C]/40" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors line-clamp-1">{b.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{b.speaker} · {new Date(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Listen history */}
          <SectionCard
            title="Continue Listening"
            iconEl={<Headphones size={14} />}
            action={
              <Link href="/sermons" className="text-xs text-[#87102C] dark:text-[#e8768a] font-medium flex items-center gap-1 hover:underline">
                All sermons <ChevronRight size={12} />
              </Link>
            }
          >
            {listenHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Headphones size={22} className="text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No listening history yet</p>
                <Link href="/sermons" className="text-xs text-[#87102C] dark:text-[#e8768a] mt-1 hover:underline">Start listening</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {listenHistory.slice(0, 5).map((p) => {
                  const pct = p.audioDuration && p.audioDuration > 0
                    ? Math.min(100, Math.round((p.positionSec / p.audioDuration) * 100))
                    : null;
                  return (
                    <Link key={p.slug} href={`/sermons/${p.slug}`}
                      className="flex gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-lg p-1.5 -mx-1.5 transition-colors group">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt={p.title} className="w-12 aspect-video rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 aspect-video rounded bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                          <Play size={12} className="text-[#87102C]/40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors line-clamp-1">{p.title}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{p.speaker} · {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                        {pct !== null && !p.completed && (
                          <div className="mt-1 h-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-[#87102C]" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                        {p.completed && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Completed</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Profile Edit ─────────────────────────────────────────────────── */}
      {member && (
        <ProfileEditCard member={member} initials={initials} />
      )}

    </div>
  );
}