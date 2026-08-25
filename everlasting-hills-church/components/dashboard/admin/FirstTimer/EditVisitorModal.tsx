"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import Loader from "@/components/ui/feedback/Loader";
import { Select } from "@/components/ui/select";
import type { VisitorRow } from "./types";

const inputClass =
  "w-full text-sm rounded-xl px-3.5 py-2.5 border border-[#E7CDD3]/60 dark:border-white/[0.10] bg-white dark:bg-white/[0.06] text-[#111] dark:text-white placeholder:text-[#a8a3a4] focus:outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 transition-all";
const labelClass = "block text-xs font-semibold text-[#5A4A4D] dark:text-white/60 mb-1.5";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  gender: string;
  attendanceType: string;
  membershipInterest: string;
};

function toForm(v: VisitorRow): FormState {
  return {
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email ?? "",
    phone: v.phone ?? "",
    address: "",
    occupation: v.occupation ?? "",
    gender: v.gender ?? "",
    attendanceType: v.attendanceType ?? "",
    membershipInterest: v.membershipInterest ?? "",
  };
}

export default function EditVisitorModal({
  visitor,
  onClose,
  onUpdated,
}: {
  visitor: VisitorRow | null;
  onClose: () => void;
  onUpdated: (visitorId: string, patch: Partial<VisitorRow>) => void;
}) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setForm(visitor ? toForm(visitor) : null);
  }, [visitor]);

  if (!mounted || !visitor || !form) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!visitor || !form) return;
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        gender: form.gender || undefined,
        attendanceType: form.attendanceType || undefined,
        membershipInterest: form.membershipInterest || undefined,
      };
      await apiClient.patch(`/visitors/${visitor.id}`, payload);
      showToast.success("Visitor updated");
      onUpdated(visitor.id, {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        occupation: payload.occupation ?? null,
        gender: payload.gender ?? null,
        attendanceType: payload.attendanceType ?? null,
        membershipInterest: payload.membershipInterest ?? null,
      });
      onClose();
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Couldn't update visitor");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed no-scrollbar inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && onClose()} aria-hidden="true" />
      <form
        onSubmit={handleSave}
        className="relative w-full no-scrollbar max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#1c1c1e] z-10">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Edit Visitor</h2>
          <button type="button" onClick={onClose} disabled={saving} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gender</label>
              <Select
                aria-label="Gender"
                value={form.gender}
                onChange={(v) => set("gender", v)}
                placeholder="Not set"
                className={`${inputClass} text-left flex items-center justify-between`}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                ]}
              />
            </div>
            <div>
              <label className={labelClass}>Attendance type</label>
              <Select
                aria-label="Attendance type"
                value={form.attendanceType}
                onChange={(v) => set("attendanceType", v)}
                placeholder="Not set"
                className={`${inputClass} text-left flex items-center justify-between`}
                options={[
                  { value: "In-Person", label: "In-Person" },
                  { value: "Online", label: "Online" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Occupation</label>
            <input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Membership interest</label>
            <Select
              aria-label="Membership interest"
              value={form.membershipInterest}
              onChange={(v) => set("membershipInterest", v)}
              placeholder="Not set"
              className={`${inputClass} text-left flex items-center justify-between`}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "Maybe", label: "Maybe" },
                { value: "No", label: "No" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 sticky bottom-0">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader size="xs" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
