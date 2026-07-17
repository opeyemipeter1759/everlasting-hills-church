"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useUnitOptions, type DirectoryParams } from "@/lib/api/people";
import { STATUS_OPTIONS } from "./peopleShared";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";
import { Select } from "@/components/ui/select";

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
    <FormModal
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
          <Select
            className={fieldCls}
            aria-label="Status"
            value={draft.status ?? ""}
            onChange={(v) => set({ status: v })}
            options={[
              { value: "", label: "Any status" },
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })),
            ]}
          />
        </Field>

        <Field label="Gender">
          <Select
            className={fieldCls}
            aria-label="Gender"
            value={draft.gender ?? ""}
            onChange={(v) => set({ gender: v })}
            options={[
              { value: "", label: "Any gender" },
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
        </Field>

        <Field label="EHC Service Team">
          <Select
            className={fieldCls}
            aria-label="EHC Service Team"
            value={draft.unit ?? ""}
            onChange={(v) => set({ unit: v })}
            options={[
              { value: "", label: "Any team" },
              ...(units.data ?? []).map((u) => ({ value: u.id, label: u.name })),
            ]}
          />
        </Field>

        <Field label="Birth month">
          <Select
            className={fieldCls}
            aria-label="Birth month"
            value={draft.birthMonth ?? ""}
            onChange={(v) => set({ birthMonth: v })}
            options={[
              { value: "", label: "Any month" },
              ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
            ]}
          />
        </Field>

        <Field label="Joined from">
          <input className={fieldCls} type="date" value={draft.joinedFrom ?? ""} onChange={(e) => set({ joinedFrom: e.target.value })} />
        </Field>

        <Field label="Joined to">
          <input className={fieldCls} type="date" value={draft.joinedTo ?? ""} onChange={(e) => set({ joinedTo: e.target.value })} />
        </Field>
      </div>
    </FormModal>
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
