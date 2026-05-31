"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface ProfileViewModel {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  photoUrl: string | null;
  address: string | null;
  role: string | null;
  joinedAt: string | null;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
  VISITOR: "Visitor",
};

function initialsOf(first: string | null, last: string | null) {
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
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const months = Math.max(
    0,
    Math.round((Date.now() - then) / (1000 * 60 * 60 * 24 * 30.44)),
  );
  if (months < 1) return "Just joined";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} in`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0
    ? `${years} year${years === 1 ? "" : "s"} in`
    : `${years}y ${rem}m in`;
}

interface InfoChipProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}

function InfoChip({ icon: Icon, label, value }: InfoChipProps) {
  return (
    <div className="flex items-start gap-3 p-4 sm:p-5 bg-white border border-[#E7CDD3]/60 rounded-2xl hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.06)] hover:-translate-y-0.5 transition-all duration-300">
      <div
        aria-hidden="true"
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FFE8ED] flex items-center justify-center flex-shrink-0"
      >
        <Icon size={16} className="text-[#87102C]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#8a7e80]">
          {label}
        </p>
        <p className="text-sm font-semibold text-[#111] mt-1 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileView({ profile }: { profile: ProfileViewModel }) {
  const displayName =
    `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "Member";
  const initials = initialsOf(profile.firstName, profile.lastName);
  const role = profile.role ? ROLE_LABEL[profile.role] ?? profile.role : "Member";
  const tenure = tenureFrom(profile.joinedAt);

  return (
    <div className="space-y-6">
      {/* Header + breadcrumb */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-[10px] tracking-[0.28em] uppercase font-semibold text-[#87102C]/80 mb-1.5">
            Member Portal
          </p>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight">My Profile</h1>
        </div>
        <nav
          aria-label="Breadcrumb"
          className="text-sm flex items-center gap-2 text-[#8a7e80]"
        >
          <Link href="/dashboard" className="hover:text-[#111] transition-colors">
            Dashboard
          </Link>
          <span aria-hidden="true" className="text-[#cbb9bd]">
            /
          </span>
          <span className="text-[#87102C] font-semibold">Profile</span>
        </nav>
      </motion.header>

      {/* Identity hero card — split layout */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: easeOut }}
        aria-labelledby="identity-title"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#87102C] via-[#6E0C24] to-[#4a0819] text-white"
      >
        {/* subtle noise + radial glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 w-64 h-64 rounded-full bg-amber-200/10 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* avatar */}
          {profile.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.photoUrl}
              alt={displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white/15 shadow-2xl shadow-black/30 flex-shrink-0"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white text-[#87102C] flex items-center justify-center text-3xl font-extrabold ring-4 ring-white/15 shadow-2xl shadow-black/30 flex-shrink-0"
            >
              {initials}
            </div>
          )}

          {/* identity */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.32em] uppercase font-bold text-amber-300/90 mb-1.5">
              Everlasting Hills · {role}
            </p>
            <h2
              id="identity-title"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.1] text-balance"
            >
              {displayName}
            </h2>
            <p className="text-sm text-white/65 mt-2 leading-relaxed">
              {tenure
                ? `${tenure} as part of the Everlasting Hills family.`
                : "Welcome to the Everlasting Hills family."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm">
                <ShieldCheck size={12} />
                {role}
              </span>
              {profile.joinedAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm">
                  <Calendar size={12} />
                  Joined {fmtJoined(profile.joinedAt)}
                </span>
              )}
            </div>
          </div>

          {/* edit CTA */}
          <div className="flex-shrink-0">
            <Link
              href="/dashboard/settings"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#87102C] text-sm font-bold tracking-wide hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-xl shadow-lg transition-all duration-200"
            >
              <Pencil size={14} />
              Edit profile
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Info chip grid */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.18, ease: easeOut }}
        aria-labelledby="contact-title"
        className="space-y-3"
      >
        <div className="flex items-center gap-3 px-1">
          <h3
            id="contact-title"
            className="text-[10px] tracking-[0.24em] uppercase font-bold text-[#87102C]"
          >
            How we reach you
          </h3>
          <span className="h-px flex-1 bg-[#E7CDD3]/60" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoChip
            icon={Mail}
            label="Email"
            value={profile.email ?? <span className="text-[#8a7e80]">Not set</span>}
          />
          <InfoChip
            icon={Phone}
            label="Phone"
            value={profile.phone ?? <span className="text-[#8a7e80]">Not set</span>}
          />
          <InfoChip
            icon={MapPin}
            label="Address"
            value={profile.address ?? <span className="text-[#8a7e80]">Not set</span>}
          />
          <InfoChip
            icon={Calendar}
            label="Joined"
            value={fmtJoined(profile.joinedAt)}
          />
        </div>
      </motion.section>

      {/* Bio */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.28, ease: easeOut }}
        aria-labelledby="bio-title"
      >
        <div className="bg-white border border-[#E7CDD3]/60 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-[#FFE8ED] flex items-center justify-center"
            >
              <Sparkles size={16} className="text-[#87102C]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#8a7e80]">
                Bio
              </p>
              <h3 id="bio-title" className="text-base font-bold text-[#111] -mt-0.5">
                A short word
              </h3>
            </div>
          </div>

          {profile.bio ? (
            <p className="text-[15px] leading-relaxed text-[#3a2d30] whitespace-pre-line max-w-[58ch]">
              {profile.bio}
            </p>
          ) : (
            <div className="text-sm text-[#8a7e80] max-w-[58ch] leading-relaxed">
              <p>
                You haven&apos;t added a bio yet. Share a line about your walk, your
                tribe at EHC, or what you carry in this season.
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 mt-3 text-[#87102C] font-semibold hover:underline"
              >
                Add a bio
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
