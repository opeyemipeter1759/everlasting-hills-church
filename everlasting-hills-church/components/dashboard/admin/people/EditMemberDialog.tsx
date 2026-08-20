"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  useUpdateMember,
  useUnitOptions,
  useAddMemberToUnit,
  useRemoveMemberFromUnit,
  type PersonRow,
} from "@/lib/api/people";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";
import { Select } from "@/components/ui/select";

export default function EditMemberDialog({
  person,
  onClose,
}: {
  person: PersonRow | null;
  onClose: () => void;
}) {
  const update = useUpdateMember();
  const { data: unitOptions } = useUnitOptions();
  const addToUnit = useAddMemberToUnit();
  const removeFromUnit = useRemoveMemberFromUnit();
  const [unitToAdd, setUnitToAdd] = useState("");
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

  const availableUnits = (unitOptions ?? []).filter(
    (u) => !person?.units.some((pu) => pu.id === u.id),
  );

  async function handleAddUnit() {
    if (!person || !unitToAdd) return;
    setError(null);
    try {
      await addToUnit.mutateAsync({ unitId: unitToAdd, memberId: person.id });
      setUnitToAdd("");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't add to unit");
    }
  }

  async function handleRemoveUnit(unitId: string) {
    if (!person) return;
    setError(null);
    try {
      await removeFromUnit.mutateAsync({ unitId, memberId: person.id });
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't remove from unit");
    }
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
    <FormModal
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
          <Select
            className={fieldCls}
            aria-label="Gender"
            value={form.gender}
            onChange={(v) => set({ gender: v as typeof form.gender })}
            options={[
              { value: "", label: "—" },
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
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

      {person && (
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">
            Units / service teams
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {person.units.length === 0 && (
              <span className="text-xs text-gray-400 dark:text-white/30">Not on any unit yet.</span>
            )}
            {person.units.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFF4F6] text-[#9b3050] border border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10"
              >
                {u.name}
                <button
                  type="button"
                  onClick={() => handleRemoveUnit(u.id)}
                  disabled={removeFromUnit.isPending}
                  aria-label={`Remove from ${u.name}`}
                  className="rounded-full hover:text-red-600 disabled:opacity-50"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select
              className={fieldCls}
              aria-label="Add to unit"
              value={unitToAdd}
              onChange={(v) => setUnitToAdd(v)}
              options={[
                { value: "", label: availableUnits.length ? "Add to a unit…" : "No other units" },
                ...availableUnits.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
            <button
              type="button"
              className={btnGhost}
              disabled={!unitToAdd || addToUnit.isPending}
              onClick={handleAddUnit}
            >
              {addToUnit.isPending ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </FormModal>
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
