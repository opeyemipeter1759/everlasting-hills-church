"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  Heart, BookOpen, Sparkles, CheckCircle2, Calendar,
  User, Phone, MapPin, Lock, ChevronDown, ChevronUp,
  Clock, TrendingUp, LogOut,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberData {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
}

interface RecentService {
  serviceName: string;
  date: Date;
}

interface Props {
  member: MemberData | null;
  userEmail: string | undefined;
  attendanceCount: number;
  recentAttendance: RecentService[];
  hasCheckedInToday: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function avatarGradient(name: string) {
  const gradients = [
    "from-rose-500 to-pink-600",
    "from-violet-500 to-purple-600",
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return gradients[Math.abs(h) % gradients.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/8 border border-white/10">
      <Icon size={16} className="text-white/40" />
      <span className="text-lg font-bold text-white leading-none">{value}</span>
      <span className="text-[10px] text-white/40 uppercase tracking-wide font-medium">{label}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#87102C]/30 flex items-center justify-center">
            <Icon size={14} className="text-[#e8768a]" />
          </div>
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] text-white/35 mb-0.5 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-white/80">{value ?? <span className="text-white/20 italic">Not set</span>}</p>
    </div>
  );
}

function EditField({
  label, type = "text", value, onChange, placeholder,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-white/35 mb-1.5 font-medium uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#87102C]/60 focus:bg-white/8 transition-colors"
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MemberProfileClient({
  member,
  userEmail,
  attendanceCount,
  recentAttendance,
  hasCheckedInToday,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [address, setAddress] = useState(member?.address ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(member?.dateOfBirth ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [changingPwd, setChangingPwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState("");

  const [showAllAttendance, setShowAllAttendance] = useState(false);

  const displayName = member
    ? `${member.firstName} ${member.lastName}`
    : userEmail ?? "Member";

  const firstName = member?.firstName ?? displayName.split(" ")[0];
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : displayName.charAt(0).toUpperCase();
  const gradient = avatarGradient(displayName);

  const isSunday = true; // const isSunday = new Date().getDay() === 0;

  const visibleAttendance = showAllAttendance
    ? recentAttendance
    : recentAttendance.slice(0, 3);

  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  async function handleCheckIn() {
    setCheckInLoading(true);
    setCheckInError("");
    try {
      const res = await fetch("/api/attendance/check-in", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckInError(json.error ?? "Check-in failed. Please try again.");
        return;
      }
      setCheckedIn(true);
    } catch {
      setCheckInError("Network error. Please try again.");
    } finally {
      setCheckInLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/members/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address, dateOfBirth }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setSaveError(json.error ?? "Failed to save changes");
        return;
      }
      setSaveSuccess(true);
      setEditing(false);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    setPwdError("");
    setPwdSuccess(false);
    if (newPwd.length < 6) { setPwdError("Password must be at least 6 characters"); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match"); return; }
    setPwdLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) { setPwdError(error.message); return; }
      setPwdSuccess(true);
      setChangingPwd(false);
      setNewPwd("");
      setConfirmPwd("");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white">

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0d0d0d]/80 backdrop-blur-md border-b border-white/8">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#87102C] flex items-center justify-center">
              <span className="text-[10px] font-black text-white">EHC</span>
            </div>
            <span className="text-sm font-semibold text-white/70">Member Portal</span>
          </div>
          <LogoutButton className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors">
            <LogOut size={13} />
            Sign out
          </LogoutButton>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-12 space-y-4">

        {/* ── Hero card ───────────────────────────────────────────────────── */}
        <div className="mt-5 rounded-3xl overflow-hidden relative">
          {/* gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#87102C] via-[#6b0d24] to-[#3a0613]" />
          {/* decorative circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />

          <div className="relative px-6 pt-7 pb-6">
            <p className="text-white/50 text-xs mb-4">{greeting} 👋</p>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl font-black flex-shrink-0 shadow-lg`}>
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
                <p className="text-white/45 text-xs mt-0.5">{userEmail}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white/70 uppercase tracking-wide">
                  Member
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="Services" value={attendanceCount} icon={Calendar} />
              <StatPill
                label="This month"
                value={recentAttendance.filter(r => {
                  const d = new Date(r.date);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
                icon={TrendingUp}
              />
              <StatPill
                label="Streak"
                value={`${Math.min(attendanceCount, 7)}wk`}
                icon={Sparkles}
              />
            </div>
          </div>
        </div>

        {/* ── Check-in card ──────────────────────────────────────────────── */}
        {isSunday && (
          <div className={`rounded-2xl border p-5 transition-all ${
            checkedIn
              ? "bg-emerald-500/10 border-emerald-500/25"
              : "bg-white/5 border-white/10"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                checkedIn ? "bg-emerald-500/20" : "bg-[#87102C]/25"
              }`}>
                <CheckCircle2 size={20} className={checkedIn ? "text-emerald-400" : "text-[#e8768a]"} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-0.5">
                  {checkedIn ? "You're checked in!" : "Sunday Service"}
                </h3>
                <p className="text-white/45 text-xs">
                  {checkedIn
                    ? "Attendance recorded for today's service. God bless you!"
                    : "Mark your attendance for today's service."}
                </p>
              </div>
              {!checkedIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#87102C] text-white text-xs font-bold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {checkInLoading ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Check In
                </button>
              )}
            </div>
            {checkInError && (
              <p className="text-red-400 text-xs mt-3 bg-red-500/10 rounded-lg px-3 py-2">{checkInError}</p>
            )}
          </div>
        )}

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Give", href: "/give", icon: Heart, color: "text-rose-400", bg: "bg-rose-500/15" },
            { label: "Prayer Request", href: "/prayer-request", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/15" },
            { label: "Testimony", href: "/testimony", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/15" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white/5 border border-white/8 px-2 py-4 hover:bg-white/10 hover:border-white/15 transition-all"
            >
              <div className={`w-9 h-9 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon size={17} className={action.color} />
              </div>
              <span className="text-[11px] text-white/60 font-medium leading-tight text-center">
                {action.label}
              </span>
            </a>
          ))}
        </div>

        {/* ── Attendance ─────────────────────────────────────────────────── */}
        <SectionCard title="My Attendance" icon={Calendar}>
          {attendanceCount === 0 ? (
            <div className="text-center py-6 text-white/30 text-sm">
              <Clock size={28} className="mx-auto mb-2 opacity-30" />
              No records yet. Check in on Sunday to get started.
            </div>
          ) : (
            <div className="space-y-1">
              {visibleAttendance.map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 rounded-xl px-3 hover:bg-white/5 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{r.serviceName}</p>
                  </div>
                  <span className="text-[11px] text-white/35 flex-shrink-0">{fmt(r.date)}</span>
                </div>
              ))}

              {recentAttendance.length > 3 && (
                <button
                  onClick={() => setShowAllAttendance((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mt-2 px-3"
                >
                  {showAllAttendance ? (
                    <><ChevronUp size={13} /> Show less</>
                  ) : (
                    <><ChevronDown size={13} /> Show all {recentAttendance.length} records</>
                  )}
                </button>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Profile ────────────────────────────────────────────────────── */}
        <SectionCard
          title="Profile Information"
          icon={User}
          action={
            !editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-[#e8768a] hover:text-white transition-colors font-medium"
              >
                Edit
              </button>
            ) : undefined
          }
        >
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-white/35 mb-0.5 font-medium uppercase tracking-wide">First Name</p>
                  <p className="text-sm text-white/50 italic">{member?.firstName} <span className="text-[10px]">(contact admin)</span></p>
                </div>
                <div>
                  <p className="text-[11px] text-white/35 mb-0.5 font-medium uppercase tracking-wide">Last Name</p>
                  <p className="text-sm text-white/50 italic">{member?.lastName}</p>
                </div>
              </div>
              <EditField label="Phone Number" type="tel" value={phone} onChange={setPhone} placeholder="e.g. 08012345678" />
              <EditField label="Address" value={address} onChange={setAddress} placeholder="Your address" />
              <div>
                <label className="block text-[11px] text-white/35 mb-1.5 font-medium uppercase tracking-wide">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#87102C]/60 [color-scheme:dark]"
                />
              </div>
              {saveError && (
                <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{saveError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setSaveError("");
                    setPhone(member?.phone ?? "");
                    setAddress(member?.address ?? "");
                    setDateOfBirth(member?.dateOfBirth ?? "");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/8 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" value={member?.firstName} />
                <Field label="Last Name" value={member?.lastName} />
              </div>
              <Field label="Email" value={userEmail} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" value={member?.phone} />
                <Field
                  label="Date of Birth"
                  value={
                    member?.dateOfBirth
                      ? new Date(member.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                      : null
                  }
                />
              </div>
              <Field label="Address" value={member?.address} />
              {saveSuccess && (
                <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Profile updated successfully.
                </p>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <SectionCard
          title="Password"
          icon={Lock}
          action={
            !changingPwd ? (
              <button
                onClick={() => setChangingPwd(true)}
                className="text-xs text-[#e8768a] hover:text-white transition-colors font-medium"
              >
                Change
              </button>
            ) : undefined
          }
        >
          {!changingPwd ? (
            <p className="text-sm text-white/35">
              Keep your account secure with a strong password.
            </p>
          ) : (
            <div className="space-y-4">
              <EditField label="New Password" type="password" value={newPwd} onChange={setNewPwd} placeholder="At least 6 characters" />
              <EditField label="Confirm New Password" type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Repeat password" />
              {pwdError && (
                <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{pwdError}</p>
              )}
              {pwdSuccess && (
                <p className="text-emerald-400 text-sm flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Password changed successfully.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handlePasswordChange}
                  disabled={pwdLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60"
                >
                  {pwdLoading ? "Updating…" : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => { setChangingPwd(false); setPwdError(""); setNewPwd(""); setConfirmPwd(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/8 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </SectionCard>

      </div>
    </main>
  );
}
