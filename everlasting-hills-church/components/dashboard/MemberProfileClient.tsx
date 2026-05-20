"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import LogoutButton from "@/components/auth/LogoutButton";

interface MemberData {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD string
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

function fmt(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

  const displayName = member
    ? `${member.firstName} ${member.lastName}`
    : userEmail ?? "Member";

  const initial = displayName.charAt(0).toUpperCase();

  // Sunday check (browser local time — correct for Nigeria)
  // const isSunday = new Date().getDay() === 0;
  const isSunday = true;


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
    if (newPwd.length < 6) {
      setPwdError("Password must be at least 6 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match");
      return;
    }
    setPwdLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) {
        setPwdError(error.message);
        return;
      }
      setPwdSuccess(true);
      setChangingPwd(false);
      setNewPwd("");
      setConfirmPwd("");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-church-dark text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">
              Everlasting Hills Church
            </p>
            <h1 className="text-xl font-bold">Member Portal</h1>
          </div>
          <LogoutButton className="text-sm text-white/40 hover:text-white transition-colors" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Welcome card */}
        <div className="rounded-2xl bg-gradient-to-br from-church-maroon/30 to-church-maroon/10 border border-church-maroon/30 p-5 flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-church-maroon flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold truncate">
              Welcome, {displayName}!
            </h2>
            <p className="text-white/50 text-xs sm:text-sm truncate">{userEmail}</p>
          </div>
        </div>

        {/* ── Check-in card (visible on Sundays) ───────────────────────────── */}
        {isSunday && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-church-maroon/20 flex items-center justify-center flex-shrink-0 text-lg">
                ✝️
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-0.5">Sunday Service</h3>
                <p className="text-white/50 text-xs mb-3">
                  {checkedIn
                    ? "You're checked in for today's service. God bless you!"
                    : "Mark your attendance for today's service."}
                </p>
                {checkedIn ? (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Checked in ✓
                  </span>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkInLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-church-maroon text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60"
                  >
                    {checkInLoading ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Checking in…
                      </>
                    ) : (
                      "Check In Today"
                    )}
                  </button>
                )}
                {checkInError && (
                  <p className="text-red-400 text-xs mt-2">{checkInError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Attendance stats ──────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-sm">My Attendance</h3>
            <span className="text-xs bg-church-maroon/20 text-church-accent px-2.5 py-0.5 rounded-full font-bold">
              {attendanceCount} service{attendanceCount !== 1 ? "s" : ""}
            </span>
          </div>

          {attendanceCount === 0 ? (
            <div className="px-5 py-6 text-center text-white/30 text-sm">
              No attendance records yet. Check in on Sunday to get started.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentAttendance.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-church-maroon/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-church-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-white/80 truncate max-w-[160px] sm:max-w-xs">
                      {r.serviceName}
                    </span>
                  </div>
                  <span className="text-xs text-white/40 flex-shrink-0 ml-3">{fmt(r.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Profile card ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Profile Information</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-church-accent hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={member?.firstName} />
              <Field label="Last Name" value={member?.lastName} />
            </div>
            <Field label="Email" value={userEmail} />

            {editing ? (
              <>
                <EditField
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="e.g. 08012345678"
                />
                <EditField
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Your address"
                />
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-church-maroon/60 [color-scheme:dark]"
                  />
                </div>
                {saveError && (
                  <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                    {saveError}
                  </p>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-church-maroon text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60"
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
                    className="flex-1 py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <Field label="Phone" value={member?.phone} />
                <Field label="Address" value={member?.address} />
                <Field
                  label="Date of Birth"
                  value={
                    member?.dateOfBirth
                      ? new Date(member.dateOfBirth).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : null
                  }
                />
                {saveSuccess && (
                  <p className="text-green-400 text-xs">Profile updated successfully.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Change password ───────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Password</h3>
            {!changingPwd && (
              <button
                onClick={() => setChangingPwd(true)}
                className="text-xs text-church-accent hover:underline"
              >
                Change
              </button>
            )}
          </div>
          <div className="p-5">
            {!changingPwd ? (
              <p className="text-sm text-white/40">
                Keep your account secure with a strong password.
              </p>
            ) : (
              <div className="space-y-4">
                <EditField
                  label="New Password"
                  type="password"
                  value={newPwd}
                  onChange={setNewPwd}
                  placeholder="At least 6 characters"
                />
                <EditField
                  label="Confirm New Password"
                  type="password"
                  value={confirmPwd}
                  onChange={setConfirmPwd}
                  placeholder="Repeat password"
                />
                {pwdError && (
                  <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                    {pwdError}
                  </p>
                )}
                {pwdSuccess && (
                  <p className="text-green-400 text-sm">Password changed successfully.</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handlePasswordChange}
                    disabled={pwdLoading}
                    className="flex-1 py-2.5 rounded-xl bg-church-maroon text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60"
                  >
                    {pwdLoading ? "Updating…" : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPwd(false);
                      setPwdError("");
                      setNewPwd("");
                      setConfirmPwd("");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Give", href: "/give", icon: "💝" },
              { label: "Prayer Request", href: "/prayer-request", icon: "🙏" },
              { label: "Testimony", href: "/testimony", icon: "✨" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-2 py-4 hover:bg-white/10 hover:border-white/20 transition-colors text-center"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-[11px] sm:text-xs text-white/70 font-medium leading-tight">
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-0.5">{label}</p>
      <p className="text-sm text-white/80">{value ?? <span className="text-white/25">—</span>}</p>
    </div>
  );
}

function EditField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-church-maroon/60"
      />
    </div>
  );
}
