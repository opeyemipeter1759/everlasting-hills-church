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

interface Props {
  member: MemberData | null;
  userEmail: string | undefined;
}

export default function MemberProfileClient({ member, userEmail }: Props) {
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

  const displayName = member
    ? `${member.firstName} ${member.lastName}`
    : userEmail ?? "Member";

  const initial = displayName.charAt(0).toUpperCase();

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
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">
              Everlasting Hills Church
            </p>
            <h1 className="text-xl font-bold">Member Portal</h1>
          </div>
          <LogoutButton className="text-sm text-white/40 hover:text-white transition-colors" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Welcome card */}
        <div className="rounded-2xl bg-gradient-to-br from-church-maroon/30 to-church-maroon/10 border border-church-maroon/30 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-church-maroon flex items-center justify-center text-xl font-bold flex-shrink-0">
            {initial}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Welcome, {displayName}!</h2>
            <p className="text-white/50 text-sm">{userEmail}</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
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

          <div className="p-6 space-y-4">
            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={member?.firstName} />
              <Field label="Last Name" value={member?.lastName} />
            </div>
            <Field label="Email" value={userEmail} />

            {/* Editable fields */}
            {editing ? (
              <>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-church-maroon/60"
                    placeholder="e.g. 08012345678"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-church-maroon/60"
                    placeholder="Your address"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-church-maroon/60"
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
                      // reset to current saved values
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
                  <p className="text-green-400 text-sm">Profile updated successfully.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
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
          <div className="p-6">
            {!changingPwd ? (
              <p className="text-sm text-white/40">
                Your default password is your phone number. Change it to something secure.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-church-maroon/60"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-church-maroon/60"
                    placeholder="Repeat password"
                  />
                </div>
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

        {/* Quick actions */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
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
                className="flex flex-col items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-4 hover:bg-white/10 hover:border-white/20 transition-colors text-center"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs text-white/70 font-medium">{action.label}</span>
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
