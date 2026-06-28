"use client";

import { useMemo, useState } from "react";
import {
  UserPlus, Search, ChevronRight, Mail, Phone, MapPin,
  Briefcase, Wifi, WifiOff, CheckCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";

// ── Types ───────────────────────────────────────────────────────────────────

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
  submittedAt: string;
}

interface Props {
  visitors: VisitorRow[];
  memberEmails: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400",
  "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
  "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div className={`w-7 h-7 text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0 ${avatarColor(name)}`}>
      {initial}
    </div>
  );
}

function relativeDate(raw: string) {
  const d = new Date(raw);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

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
      {yes ? "Interested" : "Not yet"}
    </span>
  );
}

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
            ? "bg-[#87102C] text-white hover:bg-[#6E0C24]"
            : "bg-[#FFF4F6] dark:bg-white/[0.06] text-[#5A4A4D] dark:text-white/60 border border-[#E7CDD3]/60 dark:border-white/[0.10] hover:bg-[#FFE8ED] dark:hover:bg-white/[0.10]"
        }`}
      >
        {loading ? "Creating…" : "Create Account"}
      </button>
      {error && <p className="text-red-500 dark:text-red-400 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

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
            <Avatar name={name} />
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
        <td className="px-5 py-3.5 hidden sm:table-cell"><TypeBadge type={visitor.attendanceType} /></td>
        <td className="px-5 py-3.5 hidden md:table-cell"><InterestBadge interest={visitor.membershipInterest} /></td>
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
                    <Mail size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />{visitor.email}
                  </a>
                )}
                {visitor.phone && (
                  <a href={`tel:${visitor.phone}`} className="flex items-center gap-2 text-[#555] dark:text-white/60 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors">
                    <Phone size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />{visitor.phone}
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
                    <Briefcase size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />{visitor.occupation}
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

// ── Main ────────────────────────────────────────────────────────────────────

export default function FirstTimersClient({ visitors, memberEmails }: Props) {
  const [convertedEmails, setConvertedEmails] = useState(() => new Set(memberEmails));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");

  function handleCreated(email: string) {
    setConvertedEmails((prev) => new Set(Array.from(prev).concat(email)));
  }

  const interestedCount = visitors.filter((v) => v.membershipInterest === "Yes").length;
  const notYetCount = visitors.filter((v) => v.membershipInterest !== "Yes").length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return visitors.filter((v) => {
      const matchQ = !q
        || `${v.firstName} ${v.lastName}`.toLowerCase().includes(q)
        || v.email?.toLowerCase().includes(q)
        || v.phone?.includes(q);
      const matchFilter =
        filter === "all"
        || (filter === "yes" && v.membershipInterest === "Yes")
        || (filter === "no" && v.membershipInterest !== "Yes");
      return matchQ && matchFilter;
    });
  }, [visitors, search, filter]);

  const FILTER_TABS = [
    { key: "all" as const, label: "All", count: visitors.length },
    { key: "yes" as const, label: "Interested", count: interestedCount },
    { key: "no" as const, label: "Not yet", count: notYetCount },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">First Timers</h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
          Review newcomer submissions and create member accounts.
        </p>
      </div>

      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <UserPlus size={15} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                Newcomers
              </p>
              <div className="flex items-center gap-2 -mt-0.5">
                <h2 className="font-bold text-[#111] dark:text-white text-sm">All Submissions</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF4F6] dark:bg-white/[0.07] text-[#8a7e80] dark:text-white/45">
                  {visitors.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.10] overflow-hidden text-xs font-semibold">
              {FILTER_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                    filter === tab.key
                      ? "bg-[#87102C] text-white"
                      : "bg-white dark:bg-transparent text-[#8a7e80] dark:text-white/45 hover:bg-[#FFF4F6] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-bold ${filter === tab.key ? "text-white/60" : "text-[#b8a8ac] dark:text-white/25"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b8a8ac] dark:text-white/30 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search first timers…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 focus:border-[#87102C] transition-all placeholder:text-[#a8a3a4] dark:placeholder:text-white/30"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center mb-3">
              <UserPlus size={20} className="text-[#87102C] dark:text-[#FFB3C1]" />
            </div>
            <p className="text-sm font-semibold text-[#111] dark:text-white/70">
              {visitors.length === 0 ? "No first-timer submissions yet." : "No results match your search."}
            </p>
            <p className="text-xs text-[#8a7e80] dark:text-white/35 mt-1">
              {visitors.length === 0 ? "First timers will appear here after form submission." : "Try adjusting your search or filter."}
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
                {filtered.map((v) => (
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
    </div>
  );
}
