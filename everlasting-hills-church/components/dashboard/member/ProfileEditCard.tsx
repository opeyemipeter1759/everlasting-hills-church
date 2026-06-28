"use client";

import { useState } from "react";
import { User, Camera } from "lucide-react";
import type { MemberHomeProps } from "@/types";

export function ProfileEditCard({ member, initials }: {
  member: NonNullable<MemberHomeProps["member"]>;
  initials: string;
}) {
  const [photo, setPhoto] = useState(member.photoUrl ?? "");
  const [bio, setBio] = useState(member.bio ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [address, setAddress] = useState(member.address ?? "");
  const [dob, setDob] = useState(member.dateOfBirth ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO(backend): /members/me/avatar endpoint not implemented yet — file is staged but not uploaded.
    setError("Profile photo upload is coming soon. Please reach out to an admin to update your photo.");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    // TODO(backend): /members/me PATCH endpoint not implemented yet.
    setTimeout(() => {
      setError("Profile editing is coming soon. Please reach out to an admin for now.");
      setSaving(false);
    }, 400);
  }

  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/8">
        <div className="w-7 h-7 rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
          <User size={14} className="text-[#87102C]" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">My Profile</h3>
      </div>

      <form onSubmit={handleSave} className="p-5 space-y-5">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group flex-shrink-0">
            {photo ? (
              <img src={photo} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center text-xl font-bold text-[#87102C] dark:text-[#e8768a] ring-2 ring-gray-200 dark:ring-white/10">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploading} />
          </label>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{member.firstName} {member.lastName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Click avatar to upload photo · Max 2 MB</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">About Me</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Share a little about yourself…"
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 text-right">{bio.length}/500</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your home address"
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>

        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Saved!</p>}
        </div>
      </form>
    </div>
  );
}
