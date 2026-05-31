"use client";

import { useState } from "react";
import LogoutButton from "@/components/auth/LogoutButton";

// ── Shared types ──────────────────────────────────────────────────────────────
export interface VisitorRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  attendanceType: string | null;
  membershipInterest: string | null;
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

export interface PrayerRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  request: string;
  isAnonymous: boolean;
  submittedAt: Date;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  sentAt: Date;
}

export interface TestimonyRow {
  id: string;
  data: unknown;
  submittedAt: Date;
}

export interface DashboardStats {
  visitors: number;
  prayers: number;
  contacts: number;
  testimonies: number;
  members: number;
  todayCheckIns: number;
}

export interface AttendeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface TodayAttendance {
  service: { id: string; name: string; scheduledAt: Date };
  records: { member: AttendeeInfo }[];
}

export interface ServiceRow {
  id: string;
  name: string;
  scheduledAt: Date;
  _count: { attendance: number };
}

interface Props {
  userEmail: string | undefined;
  stats: DashboardStats;
  visitors: VisitorRow[];
  prayers: PrayerRow[];
  contacts: ContactRow[];
  testimonies: TestimonyRow[];
  members: MemberRow[];
  memberEmails: string[];
  todayAttendance: TodayAttendance | null;
  allServices: ServiceRow[];
}

type Tab =
  | "overview"
  | "members"
  | "first-timers"
  | "prayer"
  | "contact"
  | "testimonies"
  | "attendance";

const TABS: { key: Tab; label: string; countKey?: keyof DashboardStats }[] = [
  { key: "overview", label: "Overview" },
  { key: "members", label: "Members", countKey: "members" },
  { key: "first-timers", label: "First Timers", countKey: "visitors" },
  { key: "attendance", label: "Attendance", countKey: "todayCheckIns" },
  { key: "prayer", label: "Prayer", countKey: "prayers" },
  { key: "contact", label: "Contact", countKey: "contacts" },
  { key: "testimonies", label: "Testimonies", countKey: "testimonies" },
];

function fmt(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtFull(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Convert button ────────────────────────────────────────────────────────────
function ConvertButton({
  visitor,
  isConverted,
  onConverted,
}: {
  visitor: VisitorRow;
  isConverted: boolean;
  onConverted: (email: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isConverted) {
    return (
      <span className="inline-block text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full font-medium">
        Member
      </span>
    );
  }

  if (!visitor.email || !visitor.phone) {
    return (
      <span className="text-xs text-white/20" title="Requires both email and phone">
        N/A
      </span>
    );
  }

  async function handleConvert() {
    setLoading(true);
    setError("");
    try {
      const { apiClient } = await import("@/lib/api/axios");
      await apiClient.post(`/members/convert-visitor/${visitor.id}`);
      onConverted(visitor.email!);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-[100px]">
      <button
        onClick={handleConvert}
        disabled={loading}
        className="text-xs bg-church-maroon/20 text-church-accent border border-church-maroon/30 px-3 py-1.5 rounded-lg hover:bg-church-maroon/40 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? "Converting…" : "Make Member"}
      </button>
      {error && <p className="text-red-400 text-[10px] mt-1 leading-tight">{error}</p>}
    </div>
  );
}

// ── Expandable service row ────────────────────────────────────────────────────
function ServiceAttendanceRow({ service, isToday }: { service: ServiceRow; isToday: boolean }) {
  const [open, setOpen] = useState(isToday);
  const [attendees, setAttendees] = useState<AttendeeInfo[] | null>(
    isToday ? null : null
  );
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (attendees !== null) return;
    setLoadingAttendees(true);
    try {
      const { apiClient } = await import("@/lib/api/axios");
      const res = await apiClient.get<{ today: TodayAttendance | null; allServices: ServiceRow[] }>(
        "/attendance/today",
      );
      const todayData = res.data.today;
      if (todayData && todayData.service.id === service.id) {
        setAttendees(todayData.records.map((r) => r.member));
      } else {
        setAttendees([]);
      }
    } catch {
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  }

  return (
    <>
      <tr
        className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={toggle}
      >
        <td className="px-4 py-3.5 text-white/80 font-medium text-sm">
          <span className="flex items-center gap-2">
            <svg
              className={`w-3.5 h-3.5 text-white/30 transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {service.name}
          </span>
        </td>
        <td className="px-4 py-3.5 text-white/50 text-xs whitespace-nowrap">
          {fmtFull(service.scheduledAt)}
        </td>
        <td className="px-4 py-3.5">
          <span className="inline-block text-xs font-bold bg-church-maroon/20 text-church-accent px-2.5 py-1 rounded-full">
            {service._count.attendance}
          </span>
        </td>
        <td className="px-4 py-3.5">
          {isToday && (
            <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium">
              Today
            </span>
          )}
        </td>
      </tr>

      {open && (
        <tr className="border-b border-white/5">
          <td colSpan={4} className="px-4 pb-4 pt-0">
            <div className="ml-5 bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden">
              {loadingAttendees ? (
                <p className="text-white/30 text-xs p-4">Loading attendees…</p>
              ) : attendees && attendees.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Name", "Email", "Phone"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-white/30 font-medium uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a) => (
                      <tr key={a.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-2.5 text-white/70 font-medium">
                          {a.firstName} {a.lastName}
                        </td>
                        <td className="px-4 py-2.5 text-white/40">
                          {a.email ?? <span className="text-white/20">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-white/40">
                          {a.phone ?? <span className="text-white/20">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-white/25 text-xs p-4">
                  {attendees === null
                    ? "Click to load attendees"
                    : "No check-ins recorded for this service."}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardClient({
  userEmail,
  stats,
  visitors,
  prayers,
  contacts,
  testimonies,
  members,
  memberEmails,
  todayAttendance,
  allServices,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [convertedEmails, setConvertedEmails] = useState<Set<string>>(
    () => new Set(memberEmails)
  );

  function handleConverted(email: string) {
    setConvertedEmails((prev) => {
      const next = new Set(Array.from(prev));
      next.add(email);
      return next;
    });
  }

  const todayServiceId = todayAttendance?.service.id ?? null;

  return (
    <main className="min-h-screen bg-church-dark text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-white/40 text-sm mt-0.5">{userEmail}</p>
          </div>
          <LogoutButton className="text-sm text-white/40 hover:text-white transition-colors" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0.5 overflow-x-auto">
            {TABS.map(({ key, label, countKey }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-4 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === key
                    ? "border-church-maroon text-white"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                {label}
                {countKey && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      tab === key
                        ? "bg-church-maroon text-white"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {stats[countKey]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Members", value: stats.members },
                { label: "First Timers", value: stats.visitors },
                { label: "Today's Check-ins", value: stats.todayCheckIns },
                { label: "Prayer Requests", value: stats.prayers },
                { label: "Contact", value: stats.contacts },
                { label: "Testimonies", value: stats.testimonies },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5"
                >
                  <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider mb-2 leading-tight">
                    {card.label}
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Today's attendance */}
            {todayAttendance && todayAttendance.records.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold">
                    Today's Check-ins
                    <span className="ml-2 text-xs text-white/40 font-normal">
                      {todayAttendance.service.name}
                    </span>
                  </h2>
                  <button
                    onClick={() => setTab("attendance")}
                    className="text-xs text-church-accent hover:underline"
                  >
                    View all
                  </button>
                </div>
                <SimpleTable
                  headers={["Name", "Email", "Phone"]}
                  rows={todayAttendance.records.slice(0, 5).map((r) => [
                    `${r.member.firstName} ${r.member.lastName}`,
                    r.member.email,
                    r.member.phone,
                  ])}
                  empty=""
                />
              </div>
            )}

            {/* Recent members */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Recent Members</h2>
                <button
                  onClick={() => setTab("members")}
                  className="text-xs text-church-accent hover:underline"
                >
                  View all
                </button>
              </div>
              <SimpleTable
                headers={["Name", "Email", "Phone", "Joined"]}
                rows={members.slice(0, 5).map((m) => [
                  `${m.firstName} ${m.lastName}`,
                  m.email,
                  m.phone,
                  fmt(m.joinedAt),
                ])}
                empty="No members yet. Convert a first-timer to get started."
              />
            </div>

            {/* Recent first-timers */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Recent First Timers</h2>
                <button
                  onClick={() => setTab("first-timers")}
                  className="text-xs text-church-accent hover:underline"
                >
                  View all
                </button>
              </div>
              <SimpleTable
                headers={["Name", "Email", "Phone", "Date"]}
                rows={visitors.slice(0, 5).map((v) => [
                  `${v.firstName} ${v.lastName}`,
                  v.email,
                  v.phone,
                  fmt(v.submittedAt),
                ])}
                empty="No first-timer submissions yet."
              />
            </div>
          </div>
        )}

        {/* ── Members ───────────────────────────────────────────────────────── */}
        {tab === "members" && (
          <div>
            <SectionHeader count={members.length} label="Church Members" />
            <SimpleTable
              headers={["Name", "Email", "Phone", "Joined"]}
              rows={members.map((m) => [
                `${m.firstName} ${m.lastName}`,
                m.email,
                m.phone,
                fmt(m.joinedAt),
              ])}
              empty="No members yet. Go to First Timers and convert a visitor."
            />
          </div>
        )}

        {/* ── First Timers ──────────────────────────────────────────────────── */}
        {tab === "first-timers" && (
          <div>
            <SectionHeader count={visitors.length} label="First Timer Submissions" />
            {visitors.length === 0 ? (
              <EmptyState label="No first-timer submissions yet." />
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Name", "Attendance", "Membership Interest", "Email", "Phone", "Date", "Action"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((v) => {
                      const isConverted = !!v.email && convertedEmails.has(v.email);
                      return (
                        <tr
                          key={v.id}
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-4 py-3.5 text-white/80 font-medium whitespace-nowrap">
                            {v.firstName} {v.lastName}
                          </td>
                          <td className="px-4 py-3.5">
                            <AttendanceBadge type={v.attendanceType} />
                          </td>
                          <td className="px-4 py-3.5">
                            <InterestBadge interest={v.membershipInterest} />
                          </td>
                          <td className="px-4 py-3.5 text-white/60 text-xs">
                            {v.email ?? <span className="text-white/25">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-white/60 whitespace-nowrap text-xs">
                            {v.phone ?? <span className="text-white/25">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-white/40 whitespace-nowrap text-xs">
                            {fmt(v.submittedAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <ConvertButton
                              visitor={v}
                              isConverted={isConverted}
                              onConverted={handleConverted}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Attendance ────────────────────────────────────────────────────── */}
        {tab === "attendance" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold">Attendance Records</h2>
              <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full font-bold">
                {allServices.length} service{allServices.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Today's summary card */}
            {todayAttendance ? (
              <div className="rounded-2xl bg-church-maroon/10 border border-church-maroon/20 p-5 mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Today</p>
                  <p className="font-semibold text-sm">{todayAttendance.service.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {fmtFull(todayAttendance.service.scheduledAt)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-4xl font-bold text-church-accent">
                    {stats.todayCheckIns}
                  </p>
                  <p className="text-white/40 text-xs">checked in</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-6 text-center text-white/30 text-sm">
                No service recorded today. Members check in on Sundays.
              </div>
            )}

            {/* All services */}
            {allServices.length === 0 ? (
              <EmptyState label="No services recorded yet." />
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Service", "Date", "Check-ins", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allServices.map((s) => (
                      <ServiceAttendanceRow
                        key={s.id}
                        service={s}
                        isToday={s.id === todayServiceId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Prayer Requests ───────────────────────────────────────────────── */}
        {tab === "prayer" && (
          <div>
            <SectionHeader count={prayers.length} label="Prayer Requests" />
            <div className="space-y-3">
              {prayers.length === 0 ? (
                <EmptyState label="No prayer requests yet." />
              ) : (
                prayers.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white/5 border border-white/10 p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {p.isAnonymous ? "Anonymous" : (p.name ?? "—")}
                        </span>
                        {p.isAnonymous && (
                          <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
                            anonymous
                          </span>
                        )}
                      </div>
                      <span className="text-white/40 text-xs flex-shrink-0">
                        {fmt(p.submittedAt)}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{p.request}</p>
                    {!p.isAnonymous && (p.email || p.phone) && (
                      <p className="text-white/30 text-xs mt-2">
                        {[p.email, p.phone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Contact Messages ──────────────────────────────────────────────── */}
        {tab === "contact" && (
          <div>
            <SectionHeader count={contacts.length} label="Contact Messages" />
            <div className="space-y-3">
              {contacts.length === 0 ? (
                <EmptyState label="No contact messages yet." />
              ) : (
                contacts.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl bg-white/5 border border-white/10 p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-wrap">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-white/40 text-xs ml-2">{c.email}</span>
                      </div>
                      <span className="text-white/40 text-xs flex-shrink-0">
                        {fmt(c.sentAt)}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{c.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Testimonies ───────────────────────────────────────────────────── */}
        {tab === "testimonies" && (
          <div>
            <SectionHeader count={testimonies.length} label="Testimonies" />
            <div className="space-y-3">
              {testimonies.length === 0 ? (
                <EmptyState label="No testimonies yet." />
              ) : (
                testimonies.map((t) => {
                  const d = t.data as Record<string, string | null>;
                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl bg-white/5 border border-white/10 p-5"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{d.name ?? "Anonymous"}</span>
                          {d.share_physically && (
                            <span className="text-[10px] bg-church-maroon/20 text-church-accent px-2 py-0.5 rounded-full">
                              share physically: {d.share_physically}
                            </span>
                          )}
                        </div>
                        <span className="text-white/40 text-xs flex-shrink-0">
                          {fmt(t.submittedAt)}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{d.content}</p>
                      {d.phone_number && (
                        <p className="text-white/30 text-xs mt-2">{d.phone_number}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function AttendanceBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-white/25 text-xs">—</span>;
  const isOnline = type === "Online";
  return (
    <span
      className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
        isOnline
          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
      }`}
    >
      {isOnline ? "🌐 Online" : "🏛 In-Person"}
    </span>
  );
}

function InterestBadge({ interest }: { interest: string | null }) {
  if (!interest) return <span className="text-white/25 text-xs">—</span>;
  const styles: Record<string, string> = {
    Yes: "bg-green-500/20 text-green-300 border-green-500/30",
    Maybe: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    No: "bg-white/10 text-white/40 border-white/10",
  };
  const cls = styles[interest] ?? "bg-white/10 text-white/40 border-white/10";
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>
      {interest}
    </span>
  );
}

function SectionHeader({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-base font-semibold">{label}</h2>
      <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full font-bold">
        {count}
      </span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-white/30 text-sm">
      {label}
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: (string | null | undefined)[][];
  empty: string;
}) {
  if (rows.length === 0) return empty ? <EmptyState label={empty} /> : null;
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 sm:px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 sm:px-5 py-3.5 text-white/70 text-sm">
                  {cell ?? <span className="text-white/25">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
