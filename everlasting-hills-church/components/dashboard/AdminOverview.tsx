"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, UserPlus, CheckCircle, Heart,
  ArrowUpRight, Search, ChevronRight,
  Mail, Phone, MapPin, Briefcase, Wifi, WifiOff,
  Cake, AlertTriangle,
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
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
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

// ── Badges ────────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
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
  if (!interest) return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
  const yes = interest === "Yes";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      yes
        ? "bg-green-50 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400 border border-green-200 dark:border-emerald-500/20"
        : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10"
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

// ── Create Account Button ─────────────────────────────────────────────────────

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
      <span className="inline-flex items-center gap-1 text-[11px] bg-green-50 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400 border border-green-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
        <CheckCircle size={11} /> Member
      </span>
    );
  }
  if (!visitor.email || !visitor.phone) {
    return <span className="text-xs text-gray-300 dark:text-gray-600">No email/phone</span>;
  }

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/members/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitor.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error ?? "Failed"); return; }
      onCreated(visitor.email!);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  const highlighted = visitor.membershipInterest === "Yes";

  return (
    <div>
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap ${
          highlighted
            ? "bg-[#87102C] text-white hover:bg-[#6E0C24] shadow-sm"
            : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15"
        }`}
      >
        {loading ? "Creating…" : "Create Account"}
      </button>
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

// ── Expandable First-Timer Row ────────────────────────────────────────────────

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
        className="border-b border-gray-100 dark:border-white/8 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Avatar name={name} size="sm" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{name}</p>
              {visitor.email && (
                <p className="text-gray-400 dark:text-gray-500 text-xs leading-tight truncate max-w-[160px]">
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
          <span className="text-xs text-gray-400 dark:text-gray-500">{relativeDate(visitor.submittedAt)}</span>
        </td>
        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
          <CreateAccountBtn visitor={visitor} alreadyMember={alreadyMember} onCreated={onCreated} />
        </td>
        <td className="px-3 py-3.5">
          <div className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
            <ChevronRight size={14} />
          </div>
        </td>
      </tr>

      {open && (
        <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/8">
          <td colSpan={6} className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Contact</p>
                {visitor.email && (
                  <a href={`mailto:${visitor.email}`} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors">
                    <Mail size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    {visitor.email}
                  </a>
                )}
                {visitor.phone && (
                  <a href={`tel:${visitor.phone}`} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors">
                    <Phone size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    {visitor.phone}
                  </a>
                )}
                {visitor.locatedInIbadan !== null && (
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    {visitor.locatedInIbadan ? "Based in Ibadan" : "Visiting / outside Ibadan"}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">About</p>
                {visitor.gender && (
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span className="text-gray-400 dark:text-gray-500">Gender:</span> {visitor.gender}
                  </span>
                )}
                {visitor.occupation && (
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Briefcase size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    {visitor.occupation}
                  </span>
                )}
                {visitor.bornAgain && (
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span className="text-gray-400 dark:text-gray-500">Born again:</span> {visitor.bornAgain}
                  </span>
                )}
              </div>

              {visitor.howDidYouLearn && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">How They Found Us</p>
                  <p className="text-gray-600 dark:text-gray-300">{visitor.howDidYouLearn}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Search Input ──────────────────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

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

  const STATS = [
    { label: "Total Members",    value: stats.members,       icon: Users,       bg: "bg-sky-50 dark:bg-sky-500/15",          color: "text-sky-600 dark:text-sky-400",     href: "/dashboard/members"         },
    { label: "First Timers",     value: stats.visitors,      icon: UserPlus,    bg: "bg-amber-50 dark:bg-amber-500/15",       color: "text-amber-600 dark:text-amber-400", href: "/dashboard/first-timers"    },
    { label: "Today's Check-ins",value: stats.todayCheckIns, icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-500/15",   color: "text-emerald-600 dark:text-emerald-400", href: "/dashboard/attendance" },
    { label: "Prayer Requests",  value: stats.prayers,       icon: Heart,       bg: "bg-[#FFF4F6] dark:bg-[#87102C]/20",     color: "text-[#87102C] dark:text-[#e8768a]", href: "/dashboard/prayer-requests" },
  ] as const;

  const FILTER_TABS = [
    { key: "all" as const, label: "All",       count: recentVisitors.length },
    { key: "yes" as const, label: "Interested", count: interestedCount       },
    { key: "no"  as const, label: "Not yet",    count: notYetCount           },
  ];

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Welcome banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 px-6 py-5 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#FFF4F6] dark:from-[#1c1c1e] dark:via-[#1c1c1e] dark:to-[#2a1018] pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-[#FFF4F6] dark:from-[#2a1018] to-transparent pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[72px] font-black text-[#87102C]/5 leading-none select-none pointer-events-none">
          EHC
        </div>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-[#87102C]/60 dark:text-[#e8768a]/60 mb-1">
            {getDateString()}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}{userName ? `, ${userName}` : ""} 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's an overview of Everlasting Hills Church today.
          </p>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, bg, color, href }) => (
          <Link
            key={label}
            href={href}
            className="group relative bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 p-5 hover:border-[#E7CDD3] dark:hover:border-[#87102C]/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <ArrowUpRight
                size={15}
                className="text-gray-300 dark:text-gray-600 group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
              />
            </div>
            <p className="text-[32px] font-bold text-gray-900 dark:text-white leading-none mb-1.5">
              {value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── Birthday + Absence alert ──────────────────────────────────────── */}
      {(birthdayFeed.length > 0 || absentMembers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Birthdays this week */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden transition-colors">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/8">
              <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-500/15 flex items-center justify-center flex-shrink-0">
                <Cake size={14} className="text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">Birthdays This Week</h3>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400">
                {birthdayFeed.length}
              </span>
            </div>
            {birthdayFeed.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No upcoming birthdays</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/8">
                {birthdayFeed.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                    {b.photoUrl ? (
                      <img src={b.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${avatarColor(`${b.firstName} ${b.lastName}`)}`}>
                        {b.firstName[0]}{b.lastName[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {b.firstName} {b.lastName}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      b.daysUntil === 0
                        ? "bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400"
                        : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                    }`}>
                      {b.daysUntil === 0 ? "Today!" : `In ${b.daysUntil}d`}
                    </span>
                    <Link
                      href={`/dashboard/members/${b.id}`}
                      className="text-gray-300 dark:text-gray-600 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors flex-shrink-0"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Absent 3+ Sundays */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden transition-colors">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/8">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">Absent 3+ Sundays</h3>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {absentMembers.length}
              </span>
            </div>
            {absentMembers.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">All members attended recently</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/8 max-h-60 overflow-y-auto">
                {absentMembers.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${avatarColor(`${a.firstName} ${a.lastName}`)}`}>
                      {a.firstName[0]}{a.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {a.firstName} {a.lastName}
                      </p>
                      {a.email && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{a.email}</p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/members/${a.id}`}
                      className="text-gray-300 dark:text-gray-600 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors flex-shrink-0"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── First Timers ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">First Timers</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              {recentVisitors.length}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden text-xs font-semibold">
              {FILTER_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setFtFilter(tab.key)}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                    ftFilter === tab.key
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-white dark:bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-bold ${
                    ftFilter === tab.key ? "text-white/60 dark:text-gray-500" : "text-gray-400 dark:text-gray-500"
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
              className="text-xs text-[#87102C] dark:text-[#e8768a] hover:underline font-medium whitespace-nowrap"
            >
              View all
            </Link>
          </div>
        </div>

        {filteredVisitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserPlus size={28} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {recentVisitors.length === 0 ? "No first-timer submissions yet." : "No results match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/8">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden md:table-cell">Interest</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Action</th>
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
      </div>

      {/* ── Recent Members ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Members</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              {recentMembers.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-full sm:w-48">
              <SearchInput value={memberSearch} onChange={setMemberSearch} placeholder="Search members…" />
            </div>
            <Link
              href="/dashboard/members"
              className="text-xs text-[#87102C] dark:text-[#e8768a] hover:underline font-medium whitespace-nowrap"
            >
              View all
            </Link>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={28} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {recentMembers.length === 0 ? "No members yet." : "No results match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/8">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden sm:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const name = `${m.firstName} ${m.lastName}`;
                  return (
                    <tr key={m.id} className="border-b border-gray-100 dark:border-white/8 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white leading-tight">{name}</p>
                            {m.email && (
                              <p className="text-gray-400 dark:text-gray-500 text-xs leading-tight truncate max-w-[200px]">
                                {m.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-sm hidden sm:table-cell">
                        {m.phone ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{relativeDate(m.joinedAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
