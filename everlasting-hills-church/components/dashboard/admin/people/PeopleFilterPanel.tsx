"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useUnitOptions, type DirectoryParams } from "@/lib/api/people";
import { STATUS_OPTIONS } from "./peopleShared";
import PeopleModal, { btnGhost, btnPrimary, fieldCls } from "./PeopleModal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Adv = Pick<
  DirectoryParams,
  "status" | "gender" | "unit" | "birthMonth" | "joinedFrom" | "joinedTo"
>;

export default function PeopleFilterPanel({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value: Adv;
  onApply: (patch: Adv) => void;
}) {
  const units = useUnitOptions();
  const [draft, setDraft] = useState<Adv>(value);

  // Re-seed when reopened with new external value.
  const [wasOpen, setWasOpen] = useState(open);
  if (open && !wasOpen) {
    setWasOpen(true);
    setDraft(value);
  }
  if (!open && wasOpen) setWasOpen(false);

  function set(patch: Adv) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function reset() {
    const cleared: Adv = {
      status: "",
      gender: "",
      unit: "",
      birthMonth: "",
      joinedFrom: "",
      joinedTo: "",
    };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  }

  return (
    <PeopleModal
      open={open}
      onClose={onClose}
      title="Filter people"
      subtitle="Narrow the directory by status, service team, gender, birth month, or join date."
      footer={
        <>
          <button type="button" className={btnGhost} onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Apply filters
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Status">
          <select className={fieldCls} value={draft.status ?? ""} onChange={(e) => set({ status: e.target.value })}>
            <option value="">Any status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </Field>

        <Field label="Gender">
          <select className={fieldCls} value={draft.gender ?? ""} onChange={(e) => set({ gender: e.target.value })}>
            <option value="">Any gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </Field>

        <Field label="EHC Service Team">
          <select className={fieldCls} value={draft.unit ?? ""} onChange={(e) => set({ unit: e.target.value })}>
            <option value="">Any team</option>
            {(units.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Birth month">
          <select className={fieldCls} value={draft.birthMonth ?? ""} onChange={(e) => set({ birthMonth: e.target.value })}>
            <option value="">Any month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Joined from">
          <input className={fieldCls} type="date" value={draft.joinedFrom ?? ""} onChange={(e) => set({ joinedFrom: e.target.value })} />
        </Field>

        <Field label="Joined to">
          <input className={fieldCls} type="date" value={draft.joinedTo ?? ""} onChange={(e) => set({ joinedTo: e.target.value })} />
        </Field>
      </div>
    </PeopleModal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
