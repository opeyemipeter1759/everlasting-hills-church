"use client";

import { Plus } from "lucide-react";
import type { PersonRole } from "@/lib/api/people";
import PeopleModal, { btnGhost, btnPrimary } from "./PeopleModal";
import { useCreatePeopleForm } from "./create-people-dialog/useCreatePeopleForm";
import PersonRowCard from "./create-people-dialog/PersonRowCard";
import FailuresList from "./create-people-dialog/FailuresList";

export default function CreatePeopleDialog({
  open,
  onClose,
  assignableRoles,
}: {
  open: boolean;
  onClose: () => void;
  assignableRoles: PersonRole[];
}) {
  const defaultRole = assignableRoles[0] ?? "MEMBER";
  const form = useCreatePeopleForm(defaultRole, onClose);

  function close() {
    form.reset();
    onClose();
  }

  return (
    <PeopleModal
      open={open}
      onClose={close}
      title="Add people"
      subtitle="Create one or many at once. The phone number is their initial password — they change it on first login."
      maxWidth="max-w-3xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={close}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} disabled={!form.valid || form.create.isPending} onClick={form.submit}>
            {form.create.isPending
              ? "Creating…"
              : `Create ${form.rows.length} ${form.rows.length === 1 ? "person" : "people"}`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {form.rows.map((r, i) => (
          <PersonRowCard
            key={i}
            index={i}
            row={r}
            removable={form.rows.length > 1}
            assignableRoles={assignableRoles}
            onChange={(patch) => form.update(i, patch)}
            onRemove={() => form.removeRow(i)}
          />
        ))}

        <button
          type="button"
          onClick={form.addRow}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#E7CDD3] dark:border-white/15 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:bg-[#FFF4F6] dark:hover:bg-white/5 transition-colors"
        >
          <Plus size={15} /> Add another person
        </button>

        <FailuresList failures={form.failures} />

        {form.error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
            {form.error}
          </p>
        )}
      </div>
    </PeopleModal>
  );
}
