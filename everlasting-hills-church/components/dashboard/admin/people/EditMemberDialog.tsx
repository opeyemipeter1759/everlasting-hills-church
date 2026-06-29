"use client";

import { useState } from "react";
import { useUpdateMember, type PersonRow } from "@/lib/api/people";
import PeopleModal, { btnGhost, btnPrimary, fieldCls } from "./PeopleModal";

export default function EditMemberDialog({
  person,
  onClose,
}: {
  person: PersonRow | null;
  onClose: () => void;
}) {
  const update = useUpdateMember();
  const [form, setForm] = useState(() => ({
    firstName: person?.firstName ?? "",
    lastName: person?.lastName ?? "",
    email: person?.email ?? "",
    phone: person?.phone ?? "",
    gender: (person?.gender?.toUpperCase() as "" | "MALE" | "FEMALE") ?? "",
    dateOfBirth: person?.dateOfBirth ? person.dateOfBirth.slice(0, 10) : "",
    address: person?.address ?? "",
  }));
  const [error, setError] = useState<string | null>(null);

  // Re-seed when a different person opens the dialog.
  const [seedId, setSeedId] = useState(person?.id);
  if (person && person.id !== seedId) {
    setSeedId(person.id);
    setForm({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email ?? "",
      phone: person.phone ?? "",
      gender: (person.gender?.toUpperCase() as "" | "MALE" | "FEMALE") ?? "",
      dateOfBirth: person.dateOfBirth ? person.dateOfBirth.slice(0, 10) : "",
      address: person.address ?? "",
    });
    setError(null);
  }

  function set(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function save() {
    if (!person) return;
    setError(null);
    try {
      await update.mutateAsync({
        id: person.id,
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          gender: form.gender || null,
          dateOfBirth: form.dateOfBirth || null,
          address: form.address.trim(),
        } as Partial<PersonRow> & { dateOfBirth?: string | null },
      });
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Update failed");
    }
  }

  return (
    <PeopleModal
      open={person !== null}
      onClose={onClose}
      title={person ? `Edit · ${person.name}` : "Edit"}
      subtitle="Update contact and personal details."
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} disabled={update.isPending} onClick={save}>
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Labeled label="First name">
          <input className={fieldCls} value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
        </Labeled>
        <Labeled label="Last name">
          <input className={fieldCls} value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
        </Labeled>
        <Labeled label="Email">
          <input className={fieldCls} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </Labeled>
        <Labeled label="Phone">
          <input className={fieldCls} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Labeled>
        <Labeled label="Gender">
          <select className={fieldCls} value={form.gender} onChange={(e) => set({ gender: e.target.value as typeof form.gender })}>
            <option value="">—</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </Labeled>
        <Labeled label="Birthday">
          <input className={fieldCls} type="date" value={form.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Address">
            <input className={fieldCls} value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Street, area, city" />
          </Labeled>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </PeopleModal>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
