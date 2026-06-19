"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/home/ScrollReveal";
import {
  ArrowRight,
  Calendar,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";

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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProfileView({ profile }: { profile: ProfileViewModel }) {
  const displayName =
    `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "Member";
  const initials  = initialsOf(profile.firstName, profile.lastName);
  const role      = profile.role ? (ROLE_LABEL[profile.role] ?? profile.role) : "Member";
  const tenure    = tenureFrom(profile.joinedAt);
  const prayers   = profile.prayerCount ?? 0;
  const testimonies = profile.testimonyCount ?? 0;

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
          2. HERO PROFILE CARD
          Dark gradient card — establishes identity immediately.
          Avatar · Name · Tenure · Badge chips · Edit CTA
      ──────────────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease }}
        aria-labelledby="profile-hero-name"
        className="relative overflow-hidden rounded-2xl"
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

        <div className="relative z-10 p-7 sm:p-9 lg:p-12 flex flex-col sm:flex-row sm:items-center gap-7">

          {/* Avatar */}
          <div className="flex-shrink-0 self-start sm:self-center">
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt={`${displayName}'s profile photo`}
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl object-cover
                  ring-4 ring-white/20 shadow-2xl shadow-black/40"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl
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
            {tenure && (
              <p className="text-sm text-white/55 mt-2 leading-relaxed max-w-[44ch]">
                {tenure} as part of the Everlasting Hills family.
              </p>
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

          {/* Edit Profile CTA */}
          <div className="flex-shrink-0 self-start sm:self-center">
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
            lg (3-col): Email | Phone | Status  →  JoinDate | Address(2)
            sm (2-col): Email | Phone  →  Status | JoinDate  →  Address(2)
            xs (1-col): stacked
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Email — col 1 */}
          <ScrollReveal delay={0.05}>
            <ChipCard
              icon={Mail}
              label="Email address"
              value={
                profile.email ? (
                  <a
                    href={`mailto:${profile.email}`}
                    className="hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors break-all"
                  >
                    {profile.email}
                  </a>
                ) : (
                  <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not set</span>
                )
              }
            />
          </ScrollReveal>

          {/* Phone — col 2 */}
          <ScrollReveal delay={0.1}>
            <ChipCard
              icon={Phone}
              label="Phone number"
              value={
                profile.phone ? (
                  <a
                    href={`tel:${profile.phone}`}
                    className="hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors"
                  >
                    {profile.phone}
                  </a>
                ) : (
                  <span className="text-[#b8a8ac] dark:text-white/30 italic font-normal text-sm">Not set</span>
                )
              }
            />
          </ScrollReveal>

          {/* Membership Status — col 3 (INVERTED) */}
          <ScrollReveal delay={0.15}>
            <MembershipCard role={role} />
          </ScrollReveal>

          {/* Join Date — starts row 2, col 1 */}
          <ScrollReveal delay={0.2}>
            <ChipCard
              icon={Calendar}
              label="Member since"
              value={fmtJoined(profile.joinedAt)}
            />
          </ScrollReveal>

          {/* Address — cols 2–3 on lg, full row on sm */}
          <div className="sm:col-span-2 lg:col-span-2">
            <ScrollReveal delay={0.25} className="h-full">
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
          4. BIO — FEATURED CARD
          Quote mark decorative element. Large body text. Empty-state CTA.
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollReveal delay={0.05}>
        <section aria-labelledby="bio-section-title">
          <div className="flex items-center gap-3 mb-5">
            <h2
              id="bio-section-title"
              className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0"
            >
              In their words
            </h2>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl
            p-8 sm:p-10
            hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.06)] dark:hover:shadow-none
            transition-all duration-300">

            {/* Decorative quote mark */}
            <Quote
              size={100}
              aria-hidden="true"
              className="absolute -top-4 -left-2 pointer-events-none select-none"
              style={{ color: "rgba(135,16,44,0.04)", fill: "rgba(135,16,44,0.04)", stroke: "none" }}
            />

            <div className="relative z-10">
              {/* Card header */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                    Bio
                  </p>
                  <h3 id="bio-heading" className="text-base font-bold text-[#111] dark:text-white -mt-0.5">
                    A short word
                  </h3>
                </div>
              </div>

              {profile.bio ? (
                <p className="text-base sm:text-lg leading-relaxed text-[#3a2d30] dark:text-white/75
                  whitespace-pre-line max-w-[60ch]">
                  {profile.bio}
                </p>
              ) : (
                <div className="max-w-[52ch] space-y-4">
                  <p className="text-base text-[#8a7e80] dark:text-white/45 leading-relaxed">
                    You haven&apos;t added a bio yet. Share a line about your walk with God,
                    your tribe at EHC, or what you&apos;re carrying in this season.
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]
                      hover:gap-3 transition-all
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C]"
                  >
                    Add your bio
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ─────────────────────────────────────────────────────────────────────
          5. MEMBER INSIGHTS STRIP
          Blush-pink background section. 4 anchor insight chips.
          Shows tenure, role, prayer count, testimony count.
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollReveal delay={0.05}>
        <section
          aria-labelledby="insights-heading"
          className="bg-[#FFF4F6] dark:bg-white/[0.04] border border-[#E7CDD3]/40 dark:border-white/[0.07] rounded-2xl p-7 sm:p-9"
        >
          <div className="mb-7">
            <p className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold mb-2">
              Member Insights
            </p>
            <h3
              id="insights-heading"
              className="text-xl sm:text-2xl font-bold text-[#111] dark:text-white tracking-tight"
            >
              Your story at EHC
            </h3>
            <p className="text-sm text-[#8a7e80] dark:text-white/45 mt-2 leading-relaxed max-w-[48ch]">
              A snapshot of your journey and engagement with the Everlasting Hills community.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightChip
              icon={Calendar}
              label="Tenure"
              value={tenure}
            />
            <InsightChip
              icon={ShieldCheck}
              label="Role"
              value={role}
            />
            <InsightChip
              icon={MessageSquare}
              label="Prayers submitted"
              value={prayers > 0 ? `${prayers}` : "None yet"}
            />
            <InsightChip
              icon={Star}
              label="Testimonies shared"
              value={testimonies > 0 ? `${testimonies}` : "None yet"}
            />
          </div>
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
