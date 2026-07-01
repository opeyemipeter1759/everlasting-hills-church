"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/home/ScrollReveal";
import {
  ArrowRight,
  Bookmark,
  Cake,
  Calendar,
  CheckCircle2,
  Crown,
  Facebook,
  Flower2,
  Globe,
  Headphones,
  Heart,
  Home,
  Instagram,
  LayoutDashboard,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Music2,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Twitter,
  UserCircle2,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { ProfileViewModel, UnitMembership } from "@/components/dashboard/profile/profile-view-model";

// ── Constants ─────────────────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR:      "Pastor",
  ADMIN:       "Administrator",
  UNIT_LEAD:   "Unit Lead",
  MEMBER:      "Member",
  VISITOR:     "Visitor",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initialsOf(first: string | null, last: string | null): string {
  return `${(first ?? "?")[0] ?? ""}${(last ?? "")[0] ?? ""}`.toUpperCase();
}

function fmtJoined(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function tenureFrom(iso: string | null): string {
  if (!iso) return "New member";
  const months = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
  );
  if (months < 1) return "Just joined";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y} year${y === 1 ? "" : "s"}` : `${y}y ${m}mo`;
}

function fmtDayMonth(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

/** weddingAnniversary doubles as the "are they married" signal — there's no separate boolean field. */
function maritalStatus(weddingAnniversary: string | null): "Married" | "Single" {
  return weddingAnniversary ? "Married" : "Single";
}

function computeAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age >= 0 ? age : null;
}

function computeAgeGroup(dateOfBirth: string | null): "teen" | "adult" | null {
  const age = computeAge(dateOfBirth);
  if (age === null) return null;
  if (age >= 13 && age <= 19) return "teen";
  if (age >= 20) return "adult";
  return null;
}

interface MinistryInfo {
  slug: string;
  name: string;
  schedule: string;
  icon: LucideIcon;
}

const MINISTRY_INFO: Record<"mens" | "womens" | "teens" | "couples", MinistryInfo> = {
  mens: { slug: "mens", name: "Men's Ministry", schedule: "Every 2nd Saturday · 7:00 AM", icon: Crown },
  womens: { slug: "womens", name: "Women's Ministry", schedule: "Every 1st Sunday · After Service", icon: Flower2 },
  teens: { slug: "teens", name: "Teen's Ministry", schedule: "Every Friday · 5:00 PM", icon: Zap },
  couples: { slug: "couples", name: "Couple's Ministry", schedule: "Every 3rd Saturday · 4:00 PM", icon: Heart },
};

function getMyMinistries(
  dateOfBirth: string | null,
  gender: string | null,
  married: boolean,
): MinistryInfo[] {
  const ageGroup = computeAgeGroup(dateOfBirth);
  if (ageGroup === "teen") return [MINISTRY_INFO.teens];
  if (ageGroup !== "adult" || !gender) return [];

  const ministries: MinistryInfo[] = [];
  if (gender === "Male") ministries.push(MINISTRY_INFO.mens);
  if (gender === "Female") ministries.push(MINISTRY_INFO.womens);
  if (married) ministries.push(MINISTRY_INFO.couples);
  return ministries;
}

// ── Design primitives ─────────────────────────────────────────────────────────

/**
 * Anchor Info Chip Card — Elevated Card pattern from design system.
 * Icon in branded square + label above value below.
 */
function ChipCard({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)] hover:-translate-y-1
        transition-all duration-300 flex flex-col gap-4 h-full ${className}`}
    >
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-1.5">
          {label}
        </p>
        <div className="text-[15px] font-semibold text-[#111] dark:text-white leading-snug break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

/**
 * Inverted Card — Membership status. Burgundy background, stands out
 * as the "this one matters most" card in the grid.
 */
function MembershipCard({ role }: { role: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 h-full min-h-[160px]"
      style={{ background: "linear-gradient(150deg, #87102C 0%, #6E0C24 55%, #4a0819 100%)" }}
    >
      {/* noise texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/8 blur-2xl pointer-events-none"
      />
      <div className="relative z-10 w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
        <ShieldCheck size={17} className="text-white" aria-hidden="true" />
      </div>
      <div className="relative z-10 flex-1">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-white/50 mb-1.5">
          Membership Status
        </p>
        <p className="text-[15px] font-bold text-white">
          Active {role}
        </p>
        <p className="text-xs text-white/40 mt-3 leading-relaxed">
          Raising men who flourish beyond limits.
        </p>
      </div>
    </div>
  );
}

/**
 * Contact row — icon + label/value with a hover-revealed copy action.
 * Used inside the "Direct contact" card so Email & Phone share one
 * elevated surface instead of two near-identical chip cards.
 */
function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  href: string | null;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-0.5">
          {label}
        </p>
        {value ? (
          <a
            href={href ?? undefined}
            className="text-[15px] font-semibold text-[#111] dark:text-white hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors truncate block"
          >
            {value}
          </a>
        ) : (
          <span className="text-[15px] font-normal italic text-[#b8a8ac] dark:text-white/30">Not set</span>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-lg border border-[#E7CDD3]/60 dark:border-white/[0.12] text-[#87102C] dark:text-white/60 hover:bg-[#FFE8ED] dark:hover:bg-white/[0.08] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}

/**
 * Insight Chip — compact Anchor Info Chip for the metrics strip.
 */
function InsightChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-4 sm:p-5
      hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_4px_24px_rgba(135,16,44,0.07)] dark:hover:shadow-none hover:-translate-y-0.5
      transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] tracking-[0.18em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
          {label}
        </p>
        <p className="text-sm font-bold text-[#111] dark:text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

/**
 * Insight chip variant for the dark gradient insights section.
 * Uses glassmorphic card pattern from the design system.
 */
function DarkInsightChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-3.5
        bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-2xl p-4 sm:p-5
        hover:bg-white/[0.12] hover:border-white/[0.22]
        transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] tracking-[0.18em] uppercase font-semibold text-white/40">
          {label}
        </p>
        <p className="text-sm font-bold text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Social media ───────────────────────────────────────────────────────────────

interface SocialPlatform {
  key: "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok";
  label: string;
  Icon: LucideIcon;
  brandColor: string;
  buildUrl: (v: string) => string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "instagram",
    label: "Instagram",
    Icon: Instagram,
    brandColor: "#E1306C",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
    brandColor: "#1877F2",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://facebook.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "twitter",
    label: "Twitter / X",
    Icon: Twitter,
    brandColor: "#1DA1F2",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://twitter.com/${v.replace(/^@/, "")}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    Icon: Linkedin,
    brandColor: "#0A66C2",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://linkedin.com/in/${v.replace(/^@/, "")}`,
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: Music2,
    brandColor: "#69C9D0",
    buildUrl: (v) =>
      v.startsWith("http") ? v : `https://tiktok.com/@${v.replace(/^@/, "")}`,
  },
];

/** Renders a clean @handle from either a raw handle or a full profile URL. */
function extractHandle(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    try {
      const segment = new URL(value).pathname.split("/").filter(Boolean).pop();
      return segment ? `@${segment.replace(/^@/, "")}` : value;
    } catch {
      return value;
    }
  }
  return `@${value.replace(/^@/, "")}`;
}

function SocialCard({
  platform,
  value,
}: {
  platform: SocialPlatform;
  value: string | null;
}) {
  const { label, Icon, brandColor, buildUrl } = platform;
  const connected = !!value;
  const fullUrl = connected ? buildUrl(value!) : null;

  const inner = (
    <div
      className={`group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border h-full transition-all duration-300
        ${
          connected
            ? "bg-white dark:bg-white/[0.05] border-[#E7CDD3]/60 dark:border-white/[0.09] hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)] hover:-translate-y-0.5"
            : "bg-[#FFF4F6] dark:bg-white/[0.03] border-[#E7CDD3]/40 dark:border-white/[0.06] opacity-60"
        }`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: connected ? `${brandColor}1A` : "#FFE8ED" }}
      >
        <Icon
          size={18}
          aria-hidden="true"
          style={{ color: connected ? brandColor : "#c9b0b5" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#8a7e80] dark:text-white/40 mb-1">
          {label}
        </p>
        {connected ? (
          <>
            <p className="text-sm font-bold text-[#111] dark:text-white truncate leading-snug">
              {extractHandle(value!)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] mt-1
              group-hover:gap-1.5 transition-all">
              View profile
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </span>
          </>
        ) : (
          <p className="text-sm italic font-normal text-[#b8a8ac] dark:text-white/30 leading-tight">
            Not connected
          </p>
        )}
      </div>
    </div>
  );

  if (!connected) return inner;

  return (
    <a
      href={fullUrl!}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${extractHandle(value!)}`}
      className="block"
    >
      {inner}
    </a>
  );
}

/**
 * Profile completion bar — only counts self-editable fields (photo, bio, phone,
 * address) since gender/DOB/marital status come from the first-timer form or
 * admin records, not the Settings form.
 */
function CompletionCard({ profile }: { profile: ProfileViewModel }) {
  const checklist = [
    { label: "Profile photo", done: !!profile.photoUrl },
    { label: "Bio", done: !!profile.bio },
    { label: "Phone number", done: !!profile.phone },
    { label: "Home address", done: !!profile.address },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);
  const missing = checklist.filter((c) => !c.done);

  if (pct === 100) return null;

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111] dark:text-white">Complete your profile</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">
              {missing.length} thing{missing.length === 1 ? "" : "s"} left — {missing.map((m) => m.label).join(", ")}
            </p>
          </div>
        </div>
        <span className="text-lg font-extrabold text-[#87102C] dark:text-[#FFB3C1] flex-shrink-0">{pct}%</span>
      </div>

      <div className="h-2 rounded-full bg-[#FFE8ED] dark:bg-white/[0.08] overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease }}
          className="h-full rounded-full bg-gradient-to-r from-[#87102C] to-[#a01535]"
        />
      </div>

      <Link
        href="/dashboard/settings"
        className="group inline-flex items-center gap-2 text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:gap-3 transition-all"
      >
        Finish in Settings
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * Ministry chip card — read-only since gender/DOB aren't self-editable yet.
 */
function MinistryChipCard({ ministry }: { ministry: MinistryInfo }) {
  const Icon = ministry.icon;
  return (
    <Link
      href={`/ministries/${ministry.slug}`}
      className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)] hover:-translate-y-1
        transition-all duration-300 flex flex-col gap-4 h-full"
    >
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-[#111] dark:text-white leading-snug">{ministry.name}</p>
        <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1.5">{ministry.schedule}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]
        group-hover:gap-2.5 transition-all">
        View ministry
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </span>
    </Link>
  );
}

/**
 * Serving chip card — real admin-assigned team membership (Unit/UnitMember),
 * distinct from the inferred MinistryChipCard above.
 */
function ServingChipCard({ unit }: { unit: UnitMembership }) {
  const roleLabel = unit.isLead ? "Team Lead" : unit.isAssistant ? "Assistant" : "Team Member";
  const RoleIcon = unit.isLead ? Crown : unit.isAssistant ? Star : ShieldCheck;
  return (
    <div
      className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
        hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)]
        transition-all duration-300 flex flex-col gap-4 h-full"
    >
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <ShieldCheck size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-[#111] dark:text-white leading-snug">{unit.name}</p>
        {unit.description && (
          <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1.5">{unit.description}</p>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-1 rounded-full ${
          unit.isLead
            ? "bg-[#87102C] text-white"
            : unit.isAssistant
              ? "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
              : "bg-[#FFF4F6] text-[#87102C]/80 dark:bg-white/[0.07] dark:text-white/60"
        }`}
      >
        <RoleIcon size={12} aria-hidden="true" />
        {roleLabel}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProfileView({ profile }: { profile: ProfileViewModel }) {
  const displayName =
    `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "Member";
  const initials  = initialsOf(profile.firstName, profile.lastName);
  const role      = profile.role ? (ROLE_LABEL[profile.role] ?? profile.role) : "Member";
  const tenure    = tenureFrom(profile.joinedAt);
  const prayers     = profile.prayerCount ?? 0;
  const testimonies = profile.testimonyCount ?? 0;
  const isMarried = !!profile.weddingAnniversary;
  const birthday  = fmtDayMonth(profile.dateOfBirth);
  const anniversary = fmtDayMonth(profile.weddingAnniversary);
  const ministries = getMyMinistries(profile.dateOfBirth, profile.gender, isMarried);
  const hasEngagementStats =
    prayers > 0 ||
    testimonies > 0 ||
    profile.attendanceRate != null ||
    profile.totalServicesAttended != null ||
    profile.sermonListenStreak != null ||
    profile.bookmarkCount != null;

  return (
    <div className="space-y-8">

      {/* ─────────────────────────────────────────────────────────────────────
          1. PAGE HEADER
          Section label + page title + breadcrumb
      ──────────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold mb-2">
            Member Portal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#111] dark:text-white tracking-tight leading-[1.1] text-balance">
            My Profile
          </h1>
        </div>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#8a7e80] dark:text-white/45">
          <LayoutDashboard size={14} aria-hidden="true" />
          <Link href="/dashboard" className="hover:text-[#111] dark:hover:text-white transition-colors">
            Dashboard
          </Link>
          <span aria-hidden="true" className="text-[#cbb9bd] dark:text-white/20">/</span>
          <span className="font-semibold text-[#87102C] dark:text-[#FFB3C1]">Profile</span>
        </nav>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. HERO + STORY — TWO-COLUMN, ABOVE THE FOLD
          Left (lg:2/3): dark gradient hero — avatar, name, bio, badges, Edit CTA.
          Right (lg:1/3): condensed "Your story" panel — only the 3 facts that
          matter on day one (Tenure, Role, Membership); engagement metrics
          (prayers, testimonies, attendance, streak, bookmarks) only render
          once the member actually has data, instead of a wall of "—" chips.
          Leads with bio/photo/personality, not contact details.
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          aria-labelledby="profile-hero-name"
          className="lg:col-span-2 relative overflow-hidden rounded-2xl"
          style={{
            background:
              "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)",
          }}
        >
          {/* noise texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
          {/* radial glow orbs */}
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 -left-16 w-64 h-64 rounded-full bg-amber-300/10 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 h-full p-7 sm:p-9 lg:p-10 flex flex-col gap-7">

            <div className="flex flex-col sm:flex-row sm:items-center gap-7">
              {/* Avatar */}
              <div className="flex-shrink-0 self-start sm:self-center">
                {profile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoUrl}
                    alt={`${displayName}'s profile photo`}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover
                      ring-4 ring-white/20 shadow-2xl shadow-black/40"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl
                      bg-white/10 border border-white/20 flex items-center justify-center
                      text-3xl sm:text-4xl font-extrabold text-white
                      ring-4 ring-white/15 shadow-2xl shadow-black/30"
                  >
                    {initials}
                  </div>
                )}
              </div>

              {/* Identity block */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-[0.32em] uppercase font-bold text-[#FFB3C1] mb-2">
                  Everlasting Hills Church · {role}
                </p>
                <h2
                  id="profile-hero-name"
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white
                    tracking-tight leading-[1.1] text-balance"
                >
                  {displayName}
                </h2>
                {profile.bio ? (
                  <p className="text-sm sm:text-base text-white/70 italic mt-2 leading-relaxed max-w-[52ch] line-clamp-3">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {tenure && (
                      <p className="text-sm text-white/55 leading-relaxed">
                        {tenure} as part of the Everlasting Hills family.
                      </p>
                    )}
                    <Link
                      href="/dashboard/settings"
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB3C1] hover:text-white transition-colors"
                    >
                      Add your bio
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </Link>
                  </div>
                )}

                {/* Anchor badge chips */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full
                    bg-white/10 border border-white/15 backdrop-blur-sm
                    px-3.5 py-1.5 text-[11px] font-semibold text-white/90">
                    <ShieldCheck size={12} aria-hidden="true" />
                    {role}
                  </span>
                  {profile.joinedAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full
                      bg-white/10 border border-white/15 backdrop-blur-sm
                      px-3.5 py-1.5 text-[11px] font-semibold text-white/90">
                      <Calendar size={12} aria-hidden="true" />
                      Joined {fmtJoined(profile.joinedAt)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full
                    bg-white/10 border border-white/15 backdrop-blur-sm
                    px-3.5 py-1.5 text-[11px] font-semibold text-white/90">
                    <Sparkles size={12} aria-hidden="true" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Profile CTA */}
            <div className="mt-auto">
              <Link
                href="/dashboard/settings"
                className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl
                  bg-white text-[#87102C] text-sm font-bold tracking-wide shadow-lg
                  hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-xl
                  transition-all duration-200
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Pencil size={14} aria-hidden="true" />
                Edit Profile
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Your story — trimmed to what matters on day one; more reveals as the member engages */}
        <ScrollReveal delay={0.14} className="lg:col-span-1">
          <section
            aria-labelledby="story-heading"
            className="relative overflow-hidden rounded-2xl h-full"
            style={{
              background:
                "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              }}
            />
            <div aria-hidden="true" className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/8 blur-3xl pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-7 flex flex-col gap-5">
              <div>
                <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-semibold mb-1.5">
                  Member Insights
                </p>
                <h3 id="story-heading" className="text-lg font-bold text-white tracking-tight">
                  Your story at EHC
                </h3>
              </div>

              <div className="space-y-3">
                <DarkInsightChip icon={Calendar} label="Tenure" value={tenure} />
                <DarkInsightChip icon={ShieldCheck} label="Role" value={role} />
                <DarkInsightChip icon={Sparkles} label="Membership" value="Active" />
              </div>

              {hasEngagementStats && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  {prayers > 0 && (
                    <DarkInsightChip icon={MessageSquare} label="Prayers submitted" value={`${prayers}`} />
                  )}
                  {testimonies > 0 && (
                    <DarkInsightChip icon={Star} label="Testimonies" value={`${testimonies}`} />
                  )}
                  {profile.attendanceRate != null && (
                    <DarkInsightChip icon={TrendingUp} label="Attendance rate" value={`${profile.attendanceRate}%`} />
                  )}
                  {profile.totalServicesAttended != null && (
                    <DarkInsightChip icon={Calendar} label="Services attended" value={`${profile.totalServicesAttended}`} />
                  )}
                  {profile.sermonListenStreak != null && (
                    <DarkInsightChip
                      icon={Headphones}
                      label="Sermon streak"
                      value={`${profile.sermonListenStreak} day${profile.sermonListenStreak === 1 ? "" : "s"}`}
                    />
                  )}
                  {profile.bookmarkCount != null && (
                    <DarkInsightChip icon={Bookmark} label="Bookmarks" value={`${profile.bookmarkCount}`} />
                  )}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2b. PROFILE COMPLETION
          Only renders while something self-editable is still missing.
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollReveal delay={0.05}>
        <CompletionCard profile={profile} />
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────────────────
          3. CONTACT & MEMBERSHIP — BENTO GRID
          ┌──────┬──────┬────────────┐
          │Email │Phone │ Status     │  ← inverted card on the right
          ├──────┼──────┴────────────┤
          │Join  │  Address          │  ← address gets the wider slot
          └──────┴───────────────────┘
      ──────────────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="contact-section-label">

        <ScrollReveal>
          <div className="flex items-center gap-3 mb-5">
            <h2
              id="contact-section-label"
              className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0"
            >
              How we reach you
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
          </div>
        </ScrollReveal>

        {/*
          Grid auto-placement strategy:
            lg (3-col): Direct contact(2) | Status  →  JoinDate | Address(2)
            xs (1-col): stacked
        */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Direct contact — Email + Phone share one elevated card, col 1–2 */}
          <div className="lg:col-span-2">
            <ScrollReveal delay={0.05} className="h-full">
              <div className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl px-6 sm:px-7 py-5 h-full flex flex-col
                hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)]
                transition-all duration-300"
              >
                <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] pt-1.5">
                  Direct contact
                </p>
                <ContactRow
                  icon={Mail}
                  label="Email"
                  value={profile.email}
                  href={profile.email ? `mailto:${profile.email}` : null}
                />
                <div className="h-px bg-[#E7CDD3]/40 dark:bg-white/[0.07]" />
                <ContactRow
                  icon={Phone}
                  label="Phone"
                  value={profile.phone}
                  href={profile.phone ? `tel:${profile.phone}` : null}
                />
              </div>
            </ScrollReveal>
          </div>

          {/* Membership Status — col 3 (INVERTED) */}
          <ScrollReveal delay={0.1} className="h-full">
            <MembershipCard role={role} />
          </ScrollReveal>

          {/* Member since — starts row 2, col 1 */}
          <ScrollReveal delay={0.15}>
            <ChipCard
              icon={Calendar}
              label="Member since"
              value={fmtJoined(profile.joinedAt)}
            />
          </ScrollReveal>

          {/* Address — cols 2–3 on lg, full row below */}
          <div className="lg:col-span-2">
            <ScrollReveal delay={0.2} className="h-full">
              <ChipCard
                icon={MapPin}
                label="Home address"
                value={
                  profile.address ?? (
                    <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not set</span>
                  )
                }
              />
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          3b. PERSONAL DETAILS
          Gender, birthday + age, marital status, anniversary, household.
          Household only rendered when assigned — no wasted empty-state card.
      ──────────────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="personal-section-label">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-5">
            <h2
              id="personal-section-label"
              className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0"
            >
              Personal details
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Gender */}
          <ScrollReveal delay={0.05}>
            <ChipCard
              icon={UserCircle2}
              label="Gender"
              value={
                profile.gender ? (
                  <span className="flex items-center gap-2">
                    {profile.gender}
                    <span className="ml-auto text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-full
                      bg-[#FFE8ED] dark:bg-[#87102C]/30 text-[#87102C] dark:text-[#FFB3C1]">
                      {profile.gender === "Female" ? "♀" : "♂"}
                    </span>
                  </span>
                ) : (
                  <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not on file</span>
                )
              }
            />
          </ScrollReveal>

          {/* Birthday — shows day/month + age when DOB is on file */}
          <ScrollReveal delay={0.1}>
            <ChipCard
              icon={Cake}
              label="Birthday"
              value={
                birthday ? (
                  <span>
                    {birthday}
                    {computeAge(profile.dateOfBirth) !== null && (
                      <span className="ml-2 text-xs font-normal text-[#8a7e80] dark:text-white/40">
                        · {computeAge(profile.dateOfBirth)} yrs
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not on file</span>
                )
              }
            />
          </ScrollReveal>

          {/* Marital status — inverted (burgundy) card when married */}
          <ScrollReveal delay={0.15}>
            {isMarried ? (
              <div
                className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 h-full min-h-[160px]"
                style={{ background: "linear-gradient(150deg, #87102C 0%, #6E0C24 55%, #4a0819 100%)" }}
              >
                <div aria-hidden="true" className="absolute inset-0 opacity-[0.05] pointer-events-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }}
                />
                <div aria-hidden="true" className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/8 blur-2xl pointer-events-none" />
                <div className="relative z-10 w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Heart size={17} className="text-white" aria-hidden="true" />
                </div>
                <div className="relative z-10 flex-1">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-white/50 mb-1.5">Marital status</p>
                  <p className="text-[15px] font-bold text-white">Married</p>
                  {anniversary && (
                    <p className="text-xs text-white/50 mt-2">Anniversary · {anniversary}</p>
                  )}
                </div>
              </div>
            ) : (
              <ChipCard icon={Heart} label="Marital status" value="Single" />
            )}
          </ScrollReveal>

          {/* Household — only rendered when assigned */}
          {profile.household && (
            <div className="sm:col-span-2 lg:col-span-3">
              <ScrollReveal delay={0.2} className="h-full">
                <div className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6
                  hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-none
                  transition-all duration-300 flex items-center gap-5">
                  <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
                    <Home size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-1">Household</p>
                    <p className="text-[15px] font-bold text-[#111] dark:text-white">{profile.household}</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          )}

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          4b. TAGS
          Admin-assigned labels — read-only. Premium empty state when none set.
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollReveal delay={0.05}>
        <section aria-labelledby="tags-section-title">
          <div className="flex items-center gap-3 mb-5">
            <h2
              id="tags-section-title"
              className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0"
            >
              Ministry tags
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
          </div>

          {profile.tags.length > 0 ? (
            <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-7 sm:p-8">
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-5">
                {profile.tags.length} tag{profile.tags.length === 1 ? "" : "s"} assigned
              </p>
              <div className="flex flex-wrap gap-3">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="group inline-flex items-center gap-2 rounded-full
                      bg-[#FFE8ED] dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30
                      text-[#87102C] dark:text-[#FFB3C1] px-4 py-2 text-sm font-semibold
                      hover:bg-[#FFD8E1] dark:hover:bg-[#87102C]/35 hover:border-[#E7CDD3] dark:hover:border-[#87102C]/50
                      transition-colors duration-200"
                  >
                    <Tag size={13} aria-hidden="true" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-[#FFF4F6] dark:bg-white/[0.03] border border-dashed border-[#E7CDD3] dark:border-white/[0.10] rounded-2xl p-8 sm:p-10">
              {/* decorative background tag icon */}
              <Tag
                size={96}
                aria-hidden="true"
                className="absolute -right-4 -bottom-4 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
                style={{ color: "#87102C" }}
              />
              <div className="relative z-10 flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Tag size={19} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111] dark:text-white mb-1.5">No tags yet</p>
                  <p className="text-sm text-[#6a5a5d] dark:text-white/45 leading-relaxed max-w-[44ch]">
                    Tags are added by your ministry leaders as you serve, lead, or join a team at EHC.
                    They show your involvement in the community.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────────────────
          4c. SOCIAL MEDIA
          Platform links — clickable when set, dimmed when not.
          Stacked rows (1 col mobile → 2 cols desktop) wide enough to show
          the full resolved URL, not just the handle.
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollReveal delay={0.05}>
        <section aria-labelledby="social-section-title">
          <div className="flex items-center gap-3 mb-5">
            <h2
              id="social-section-title"
              className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0"
            >
              Connect with me
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
          </div>

          {SOCIAL_PLATFORMS.every((p) => !profile[p.key]) ? (
            <div className="bg-[#FFF4F6] dark:bg-white/[0.03] border border-[#E7CDD3]/40 dark:border-white/[0.06] rounded-2xl p-7 sm:p-8 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                <Globe size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111] dark:text-white">No social links yet</p>
                <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">
                  Add your handles in{" "}
                  <a href="/dashboard/settings" className="text-[#87102C] dark:text-[#FFB3C1] underline underline-offset-2 hover:no-underline">
                    Settings → Social Media
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {SOCIAL_PLATFORMS.map((platform) => (
                <SocialCard
                  key={platform.key}
                  platform={platform}
                  value={profile[platform.key]}
                />
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────────────────
          5b. MINISTRY GROUP
          Computed from gender + age + marital status. Quietly omitted when
          the underlying data (gender, birthday) isn't on file yet.
      ──────────────────────────────────────────────────────────────────────── */}
      {ministries.length > 0 && (
        <ScrollReveal delay={0.05}>
          <section aria-labelledby="ministry-section-title">
            <div className="flex items-center gap-3 mb-5">
              <h2
                id="ministry-section-title"
                className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0"
              >
                Your ministry group
              </h2>
              <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ministries.map((ministry) => (
                <MinistryChipCard key={ministry.slug} ministry={ministry} />
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          5c. SERVING AT EHC
          Real, admin-assigned team membership (Unit/UnitMember) — distinct
          from the inferred "ministry group" above. Read-only here; unit
          assignment is managed by admins, not self-service.
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollReveal delay={0.05}>
        <section aria-labelledby="serving-section-title">
          <div className="flex items-center gap-3 mb-5">
            <h2
              id="serving-section-title"
              className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0"
            >
              Serving at EHC
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
          </div>

          {profile.units.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profile.units.map((unit) => (
                <ServingChipCard key={unit.id} unit={unit} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6 sm:p-8 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111] dark:text-white">Not yet on a serving team</p>
                <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1">
                  You&rsquo;re not currently assigned to a unit. Speak with a ministry leader if you&rsquo;d like to start serving.
                </p>
              </div>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────────────────
          6. FOOTER CTA ROW
          Church identity + quick action buttons.
          Secondary + Primary CTA pattern from design system.
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollReveal delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5
          p-6 sm:p-8 bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl
          hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.06)] dark:hover:shadow-none
          transition-all duration-300">

          {/* Church identity */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
              <Users size={19} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111] dark:text-white">Part of the EHC Family</p>
              <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">
                Everlasting Hills Church · Ibadan, Nigeria
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href="/prayer-request"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                border border-[#E7CDD3] dark:border-white/20 text-[#87102C] dark:text-white/80 text-sm font-semibold
                hover:bg-[#FFF4F6] dark:hover:bg-white/[0.07] transition-colors
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C]"
            >
              Submit Prayer
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </a>
            <Link
              href="/dashboard/settings"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                bg-[#87102C] text-white text-sm font-semibold
                hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-[#87102C]/25 hover:-translate-y-0.5
                transition-all duration-200
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C]"
            >
              Edit Profile
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>

        </div>
      </ScrollReveal>

    </div>
  );
}
