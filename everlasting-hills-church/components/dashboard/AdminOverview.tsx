"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, UserPlus, CheckCircle, Heart,
  ArrowUpRight, Search, ChevronRight,
  Mail, Phone, MapPin, Briefcase, Wifi, WifiOff,
  Cake, AlertTriangle, BarChart3, FileText,
  CalendarDays, UserCog,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VisitorRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  attendanceType: string | null;
  membershipInterest: string | null;
  howDidYouLearn: string | null;
  locatedInIbadan: boolean | null;
  bornAgain: string | null;
  occupation: string | null;
  submittedAt: Date;
}

export interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  joinedAt: Date;
}

export interface AdminStats {
  members: number;
  visitors: number;
  todayCheckIns: number;
  prayers: number;
}

export interface BirthdayEntry {
  id: string;
  firstName: string;
  lastName: string;
  daysUntil: number;
  photoUrl: string | null;
}

export interface AbsentEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface AdminOverviewProps {
  userName: string | null;
  stats: AdminStats;
  recentVisitors: VisitorRow[];
  recentMembers: MemberRow[];
  memberEmails: string[];
  birthdayFeed: BirthdayEntry[];
  absentMembers: AbsentEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400",
  "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
  "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
  "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400",
  "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  const color = avatarColor(name);
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${color}`}>
      {initial}
    </div>
  );
}

function relativeDate(raw: Date) {
  const d = new Date(raw);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function getDateString() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Badges ─────────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-[#b8a8ac] dark:text-white/25 text-xs">—</span>;
  const online = type.toLowerCase().includes("online");
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      online
        ? "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400"
        : "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400"
    }`}>
      {online ? <Wifi size={10} /> : <WifiOff size={10} />}
      {type}
    </span>
  );
}

function InterestBadge({ interest }: { interest: string | null }) {
  if (!interest) return <span className="text-[#b8a8ac] dark:text-white/25 text-xs">—</span>;
  const yes = interest === "Yes";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      yes
        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
        : "bg-[#FFF4F6] dark:bg-white/[0.04] text-[#8a7e80] dark:text-white/40 border border-[#E7CDD3]/60 dark:border-white/[0.08]"
    }`}>
      {yes ? (
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {yes ? "Interested" : "Not yet"}
    </span>
  );
}

// ── Create Account Button ──────────────────────────────────────────────────────

function CreateAccountBtn({
  visitor, alreadyMember, onCreated,
}: {
  visitor: VisitorRow;
  alreadyMember: boolean;
  onCreated: (email: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (alreadyMember) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
        <CheckCircle size={11} /> Member
      </span>
    );
  }
  if (!visitor.email || !visitor.phone) {
    return <span className="text-xs text-[#b8a8ac] dark:text-white/30">No email/phone</span>;
  }

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const { apiClient } = await import("@/lib/api/axios");
      await apiClient.post(`/members/convert-visitor/${visitor.id}`);
      onCreated(visitor.email!);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  const highlighted = visitor.membershipInterest === "Yes";

  return (
    <div>
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap ${
          highlighted
            ? "bg-[#87102C] text-white hover:bg-[#6E0C24] hover:shadow-md hover:shadow-[#87102C]/20"
            : "bg-[#FFF4F6] dark:bg-white/[0.06] text-[#5A4A4D] dark:text-white/60 border border-[#E7CDD3]/60 dark:border-white/[0.10] hover:bg-[#FFE8ED] dark:hover:bg-white/[0.10]"
        }`}
      >
        {loading ? "Creating…" : "Create Account"}
      </button>
      {error && <p className="text-red-500 dark:text-red-400 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

// ── Expandable First-Timer Row ──────────────────────────────────────────────

function VisitorRowItem({
  visitor, alreadyMember, onCreated,
}: {
  visitor: VisitorRow;
  alreadyMember: boolean;
  onCreated: (email: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = `${visitor.firstName} ${visitor.lastName}`;

  return (
    <>
      <tr
        className="border-b border-[#E7CDD3]/40 dark:border-white/[0.07] last:border-0 hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Avatar name={name} size="sm" />
            <div>
              <p className="font-semibold text-[#111] dark:text-white text-sm leading-tight">{name}</p>
              {visitor.email && (
                <p className="text-[#8a7e80] dark:text-white/40 text-xs leading-tight truncate max-w-[160px]">
                  {visitor.email}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5 hidden sm:table-cell">
          <TypeBadge type={visitor.attendanceType} />
        </td>
        <td className="px-5 py-3.5 hidden md:table-cell">
          <InterestBadge interest={visitor.membershipInterest} />
        </td>
        <td className="px-5 py-3.5 hidden lg:table-cell">
          <span className="text-xs text-[#8a7e80] dark:text-white/40">{relativeDate(visitor.submittedAt)}</span>
        </td>
        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
          <CreateAccountBtn visitor={visitor} alreadyMember={alreadyMember} onCreated={onCreated} />
        </td>
        <td className="px-3 py-3.5">
          <div className={`text-[#b8a8ac] dark:text-white/25 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
            <ChevronRight size={14} />
          </div>
        </td>
      </tr>

      {open && (
        <tr className="bg-[#FFF4F6]/40 dark:bg-white/[0.02] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
          <td colSpan={6} className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
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
              </div>

              {visitor.howDidYouLearn && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">How They Found Us</p>
                  <p className="text-[#555] dark:text-white/60">{visitor.howDidYouLearn}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Search Input ───────────────────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b8a8ac] dark:text-white/30 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 focus:border-[#87102C] dark:focus:border-[#87102C]/65 transition-all placeholder:text-[#a8a3a4] dark:placeholder:text-white/30"
      />
    </div>
  );
}

// ── Section Card Wrapper ───────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminOverview({
  userName,
  stats,
  recentVisitors,
  recentMembers,
  memberEmails,
  birthdayFeed,
  absentMembers,
}: AdminOverviewProps) {
  const [convertedEmails, setConvertedEmails] = useState(() => new Set(memberEmails));
  const [ftSearch, setFtSearch] = useState("");
  const [ftFilter, setFtFilter] = useState<"all" | "yes" | "no">("all");
  const [memberSearch, setMemberSearch] = useState("");

  function handleCreated(email: string) {
    setConvertedEmails((prev) => new Set(Array.from(prev).concat(email)));
  }

  const interestedCount = recentVisitors.filter((v) => v.membershipInterest === "Yes").length;
  const notYetCount = recentVisitors.filter((v) => v.membershipInterest !== "Yes").length;

  const filteredVisitors = useMemo(() => {
    const q = ftSearch.toLowerCase().trim();
    return recentVisitors.filter((v) => {
      const matchQ = !q
        || `${v.firstName} ${v.lastName}`.toLowerCase().includes(q)
        || v.email?.toLowerCase().includes(q)
        || v.phone?.includes(q);
      const matchFilter =
        ftFilter === "all"
        || (ftFilter === "yes" && v.membershipInterest === "Yes")
        || (ftFilter === "no" && v.membershipInterest !== "Yes");
      return matchQ && matchFilter;
    });
  }, [recentVisitors, ftSearch, ftFilter]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return recentMembers;
    return recentMembers.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
      || m.email?.toLowerCase().includes(q)
      || m.phone?.includes(q)
    );
  }, [recentMembers, memberSearch]);

  const KPI_CARDS = [
    {
      label: "Total Members",
      value: stats.members,
      icon: Users,
      href: "/dashboard/members",
      iconBg: "bg-[#FFE8ED] dark:bg-[#87102C]/25",
      iconColor: "text-[#87102C] dark:text-[#FFB3C1]",
    },
    {
      label: "First-Time Visitors",
      value: stats.visitors,
      icon: UserPlus,
      href: "/dashboard/first-timers",
      iconBg: "bg-amber-50 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Today's Check-Ins",
      value: stats.todayCheckIns,
      icon: CheckCircle,
      href: "/dashboard/attendance",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Prayer Requests",
      value: stats.prayers,
      icon: Heart,
      href: "/dashboard/prayer-requests",
      iconBg: "bg-rose-50 dark:bg-rose-500/20",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
  ] as const;

  const QUICK_ACTIONS = [
    { label: "Manage Users", description: "Add or edit user accounts", icon: UserCog, href: "/dashboard/users" },
    { label: "Attendance", description: "Track today's service", icon: CalendarDays, href: "/dashboard/attendance" },
    { label: "Analytics", description: "Church growth insights", icon: BarChart3, href: "/dashboard/analytics" },
    { label: "Reports", description: "Generate & export data", icon: FileText, href: "/dashboard/reports" },
  ] as const;

  const FILTER_TABS = [
    { key: "all" as const, label: "All",        count: recentVisitors.length },
    { key: "yes" as const, label: "Interested",  count: interestedCount       },
    { key: "no"  as const, label: "Not yet",     count: notYetCount           },
  ];

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ─────────────────────────────────────────────────────────────────────
          1. HERO WELCOME CARD — dark gradient, full width
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
      >
        {/* Noise texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Glow orbs */}
        <div aria-hidden="true" className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-12 w-56 h-56 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
        {/* Decorative EHC watermark */}
        <div aria-hidden="true" className="absolute right-8 top-1/2 -translate-y-1/2 text-[80px] font-black text-white/[0.04] leading-none select-none pointer-events-none tracking-tight">
          EHC
        </div>

        <div className="relative z-10 p-7 sm:p-9 lg:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-[0.32em] uppercase font-bold text-[#FFB3C1] mb-2">
              {getDateString()}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.1]">
              {getGreeting()}{userName ? `, ${userName}` : ""} 👋
            </h2>
            <p className="text-sm text-white/55 mt-2 max-w-[42ch]">
              Here&apos;s an overview of Everlasting Hills Church today.
            </p>
          </div>

          {/* Inline stat chips */}
          <div className="flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold text-white/90">
              <Users size={14} aria-hidden="true" />
              {stats.members} members
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold text-white/90">
              <CheckCircle size={14} aria-hidden="true" />
              {stats.todayCheckIns} checked in today
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. KPI BENTO GRID — 4 elevated stat cards
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {KPI_CARDS.map(({ label, value, icon: Icon, href, iconBg, iconColor }) => (
          <Link
            key={label}
            href={href}
            className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6 flex flex-col gap-4
              hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:hover:shadow-none hover:-translate-y-1
              transition-all duration-300 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none"
          >
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon size={17} className={iconColor} aria-hidden="true" />
              </div>
              <ArrowUpRight
                size={15}
                className="text-[#E7CDD3] dark:text-white/20 group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-[32px] font-bold text-[#111] dark:text-white leading-none mb-1.5">
                {value.toLocaleString()}
              </p>
              <p className="text-xs text-[#8a7e80] dark:text-white/45 font-medium tracking-wide">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          3. ALERTS — birthdays + absent members (conditional)
      ──────────────────────────────────────────────────────────────────────── */}
      {(birthdayFeed.length > 0 || absentMembers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Birthdays this week */}
          <SectionCard>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
              <div className="w-9 h-9 rounded-xl bg-[#FFE8ED] dark:bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Cake size={15} className="text-rose-500 dark:text-rose-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                  Pastoral Care
                </p>
                <h3 className="text-sm font-bold text-[#111] dark:text-white -mt-0.5">Birthdays This Week</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFE8ED] dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
                {birthdayFeed.length}
              </span>
            </div>
            {birthdayFeed.length === 0 ? (
              <p className="px-6 py-6 text-sm text-[#8a7e80] dark:text-white/40 text-center">No upcoming birthdays</p>
            ) : (
              <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
                {birthdayFeed.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors">
                    {b.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${avatarColor(`${b.firstName} ${b.lastName}`)}`}>
                        {b.firstName[0]}{b.lastName[0]}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-[#111] dark:text-white flex-1 leading-tight">
                      {b.firstName} {b.lastName}
                    </p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      b.daysUntil === 0
                        ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                        : "bg-[#FFF4F6] dark:bg-white/[0.06] text-[#8a7e80] dark:text-white/45"
                    }`}>
                      {b.daysUntil === 0 ? "Today! 🎂" : `In ${b.daysUntil}d`}
                    </span>
                    <Link
                      href={`/dashboard/members/${b.id}`}
                      className="text-[#b8a8ac] dark:text-white/25 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors flex-shrink-0"
                      aria-label={`View ${b.firstName} ${b.lastName}`}
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Absent 3+ Sundays */}
          <SectionCard>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                  Follow-Up Needed
                </p>
                <h3 className="text-sm font-bold text-[#111] dark:text-white -mt-0.5">Absent 3+ Sundays</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                {absentMembers.length}
              </span>
            </div>
            {absentMembers.length === 0 ? (
              <p className="px-6 py-6 text-sm text-[#8a7e80] dark:text-white/40 text-center">All members attended recently</p>
            ) : (
              <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06] max-h-64 overflow-y-auto">
                {absentMembers.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${avatarColor(`${a.firstName} ${a.lastName}`)}`}>
                      {a.firstName[0]}{a.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111] dark:text-white leading-tight">
                        {a.firstName} {a.lastName}
                      </p>
                      {a.email && (
                        <p className="text-xs text-[#8a7e80] dark:text-white/40 truncate">{a.email}</p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/members/${a.id}`}
                      className="text-[#b8a8ac] dark:text-white/25 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors flex-shrink-0"
                      aria-label={`View ${a.firstName} ${a.lastName}`}
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          4. QUICK ACTIONS — navigation CTA cards
      ──────────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            Quick Actions
          </p>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ label, description, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5 flex flex-col gap-3
                hover:border-[#87102C]/30 dark:hover:border-white/[0.18] hover:shadow-[0_4px_24px_rgba(135,16,44,0.07)] dark:hover:shadow-none hover:-translate-y-0.5
                transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center">
                <Icon size={16} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111] dark:text-white leading-tight">{label}</p>
                <p className="text-xs text-[#8a7e80] dark:text-white/40 mt-0.5 leading-snug">{description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] mt-auto group-hover:gap-2 transition-all">
                Go
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          5. FIRST TIMERS TABLE
      ──────────────────────────────────────────────────────────────────────── */}
      <SectionCard>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <UserPlus size={15} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                Newcomers
              </p>
              <div className="flex items-center gap-2 -mt-0.5">
                <h2 className="font-bold text-[#111] dark:text-white text-sm">First Timers</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF4F6] dark:bg-white/[0.07] text-[#8a7e80] dark:text-white/45">
                  {recentVisitors.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter tabs */}
            <div className="flex rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.10] overflow-hidden text-xs font-semibold">
              {FILTER_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setFtFilter(tab.key)}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                    ftFilter === tab.key
                      ? "bg-[#87102C] text-white"
                      : "bg-white dark:bg-transparent text-[#8a7e80] dark:text-white/45 hover:bg-[#FFF4F6] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-bold ${
                    ftFilter === tab.key ? "text-white/60" : "text-[#b8a8ac] dark:text-white/25"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="w-full sm:w-48">
              <SearchInput value={ftSearch} onChange={setFtSearch} placeholder="Search first timers…" />
            </div>
            <Link
              href="/dashboard/first-timers"
              className="group text-xs text-[#87102C] dark:text-[#FFB3C1] font-semibold flex items-center gap-1 hover:gap-1.5 transition-all whitespace-nowrap"
            >
              View all
              <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>

        {filteredVisitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center mb-3">
              <UserPlus size={20} className="text-[#87102C] dark:text-[#FFB3C1]" />
            </div>
            <p className="text-sm font-semibold text-[#111] dark:text-white/70">
              {recentVisitors.length === 0 ? "No first-timer submissions yet." : "No results match your search."}
            </p>
            <p className="text-xs text-[#8a7e80] dark:text-white/35 mt-1">
              {recentVisitors.length === 0 ? "First timers will appear here after form submission." : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em]">Name</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em] hidden sm:table-cell">Type</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em] hidden md:table-cell">Interest</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em] hidden lg:table-cell">Date</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em]">Action</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((v) => (
                  <VisitorRowItem
                    key={v.id}
                    visitor={v}
                    alreadyMember={!!v.email && convertedEmails.has(v.email)}
                    onCreated={handleCreated}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ─────────────────────────────────────────────────────────────────────
          6. RECENT MEMBERS TABLE
      ──────────────────────────────────────────────────────────────────────── */}
      <SectionCard>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
              <Users size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                Congregation
              </p>
              <div className="flex items-center gap-2 -mt-0.5">
                <h2 className="font-bold text-[#111] dark:text-white text-sm">Recent Members</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF4F6] dark:bg-white/[0.07] text-[#8a7e80] dark:text-white/45">
                  {recentMembers.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-full sm:w-48">
              <SearchInput value={memberSearch} onChange={setMemberSearch} placeholder="Search members…" />
            </div>
            <Link
              href="/dashboard/members"
              className="group text-xs text-[#87102C] dark:text-[#FFB3C1] font-semibold flex items-center gap-1 hover:gap-1.5 transition-all whitespace-nowrap"
            >
              View all
              <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>

        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center mb-3">
              <Users size={20} className="text-[#87102C] dark:text-[#FFB3C1]" />
            </div>
            <p className="text-sm font-semibold text-[#111] dark:text-white/70">
              {recentMembers.length === 0 ? "No members yet." : "No results match your search."}
            </p>
            <p className="text-xs text-[#8a7e80] dark:text-white/35 mt-1">
              {recentMembers.length === 0 ? "Members will appear here once they are registered." : "Try adjusting your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em]">Member</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em] hidden sm:table-cell">Phone</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-[#87102C]/60 dark:text-white/35 uppercase tracking-[0.2em] hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const name = `${m.firstName} ${m.lastName}`;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-[#E7CDD3]/40 dark:border-white/[0.07] last:border-0 hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} />
                          <div>
                            <p className="font-semibold text-[#111] dark:text-white leading-tight">{name}</p>
                            {m.email && (
                              <p className="text-[#8a7e80] dark:text-white/40 text-xs leading-tight truncate max-w-[200px]">
                                {m.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#555] dark:text-white/55 text-sm hidden sm:table-cell">
                        {m.phone ?? <span className="text-[#b8a8ac] dark:text-white/25">—</span>}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-[#8a7e80] dark:text-white/40">{relativeDate(m.joinedAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

    </div>
  );
}
