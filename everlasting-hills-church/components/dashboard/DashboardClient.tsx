"use client";

import { useState } from "react";
import LogoutButton from "@/components/auth/LogoutButton";

// ── Shared types (passed from server component) ────────────────────────────
export interface VisitorRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  submittedAt: Date;
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
}

interface Props {
  userEmail: string | undefined;
  stats: DashboardStats;
  visitors: VisitorRow[];
  prayers: PrayerRow[];
  contacts: ContactRow[];
  testimonies: TestimonyRow[];
}

type Tab = "overview" | "first-timers" | "prayer" | "contact" | "testimonies";

const TABS: { key: Tab; label: string; countKey: keyof DashboardStats }[] = [
  { key: "overview", label: "Overview", countKey: "visitors" },
  { key: "first-timers", label: "First Timers", countKey: "visitors" },
  { key: "prayer", label: "Prayer Requests", countKey: "prayers" },
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

function truncate(str: string, max = 90) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function DashboardClient({
  userEmail,
  stats,
  visitors,
  prayers,
  contacts,
  testimonies,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <main className="min-h-screen bg-church-dark text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-white/40 text-sm mt-0.5">{userEmail}</p>
          </div>
          <LogoutButton className="text-sm text-white/40 hover:text-white transition-colors" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map(({ key, label, countKey }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === key
                    ? "border-church-maroon text-white"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                {label}
                {key !== "overview" && (
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Overview ─────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "First Timers", value: stats.visitors },
                { label: "Prayer Requests", value: stats.prayers },
                { label: "Contact Messages", value: stats.contacts },
                { label: "Testimonies", value: stats.testimonies },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5"
                >
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                    {card.label}
                  </p>
                  <p className="text-4xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Recent first-timers preview */}
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

            {/* Recent prayer requests preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Recent Prayer Requests</h2>
                <button
                  onClick={() => setTab("prayer")}
                  className="text-xs text-church-accent hover:underline"
                >
                  View all
                </button>
              </div>
              <SimpleTable
                headers={["From", "Request", "Date"]}
                rows={prayers.slice(0, 5).map((p) => [
                  p.isAnonymous ? "Anonymous" : (p.name ?? "—"),
                  truncate(p.request),
                  fmt(p.submittedAt),
                ])}
                empty="No prayer requests yet."
              />
            </div>
          </div>
        )}

        {/* ── First Timers ──────────────────────────────────────────────── */}
        {tab === "first-timers" && (
          <div>
            <SectionHeader count={visitors.length} label="First Timer Submissions" />
            <SimpleTable
              headers={["Name", "Gender", "Email", "Phone", "Date"]}
              rows={visitors.map((v) => [
                `${v.firstName} ${v.lastName}`,
                v.gender,
                v.email,
                v.phone,
                fmt(v.submittedAt),
              ])}
              empty="No first-timer submissions yet."
            />
          </div>
        )}

        {/* ── Prayer Requests ───────────────────────────────────────────── */}
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
                      <div className="flex items-center gap-2">
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

        {/* ── Contact Messages ──────────────────────────────────────────── */}
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
                      <div>
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

        {/* ── Testimonies ───────────────────────────────────────────────── */}
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
                        <div className="flex items-center gap-2">
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

// ── Small helpers ──────────────────────────────────────────────────────────

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
  if (rows.length === 0) return <EmptyState label={empty} />;
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wide"
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
                <td key={j} className="px-5 py-3.5 text-white/70">
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
