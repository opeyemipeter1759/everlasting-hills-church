"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import Loader from "@/components/ui/feedback/Loader";
import { Select } from "@/components/ui/select";
import { heardFromErrors } from "@/lib/first-timer/form-schema";
import type { VisitorRow } from "./types";
import { inputClass, labelClass, selectClass, toForm, toPayload, toPatch, type FormState } from "./editVisitorForm";
import EditVisitorHeardFrom from "./EditVisitorHeardFrom";
import { useFirstTimersMode } from "./mode";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const { editPath } = useFirstTimersMode();

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
    const problems = heardFromErrors(form);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;
    setSaving(true);
    try {
      const payload = toPayload(form);
      await apiClient.patch(editPath(visitor.id), payload);
      showToast.success("Visitor updated");
      onUpdated(visitor.id, toPatch(payload));
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

        <div className="p-4 xs:p-6 space-y-4">
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
                className={selectClass}
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
                className={selectClass}
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
          <EditVisitorHeardFrom form={form} set={set} errors={errors} />
          <div>
            <label className={labelClass}>Membership interest</label>
            <Select
              aria-label="Membership interest"
              value={form.membershipInterest}
              onChange={(v) => set("membershipInterest", v)}
              placeholder="Not set"
              className={selectClass}
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
