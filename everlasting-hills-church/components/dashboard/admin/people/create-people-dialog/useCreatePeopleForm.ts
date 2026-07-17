import { useState } from "react";
import { useBulkCreatePeople, type CreatePersonInput, type PersonRole } from "@/lib/api/people";
import { emptyRow, type Row } from "./types";

export function useCreatePeopleForm(defaultRole: PersonRole, onDone: () => void) {
  const [rows, setRows] = useState<Row[]>([emptyRow(defaultRole)]);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<{ email: string; reason: string }[]>([]);
  const create = useBulkCreatePeople();

  function reset() {
    setRows([emptyRow(defaultRole)]);
    setError(null);
    setFailures([]);
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(defaultRole)]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  const valid = rows.every(
    (r) => r.firstName.trim() && r.lastName.trim() && /.+@.+\..+/.test(r.email) && r.phone.trim().length >= 6,
  );

  async function submit() {
    setError(null);
    setFailures([]);
    const payload: CreatePersonInput[] = rows.map((r) => ({
      firstName: r.firstName.trim(),
      lastName: r.lastName.trim(),
      email: r.email.trim().toLowerCase(),
      phone: r.phone.trim(),
      role: r.role,
      ...(r.gender ? { gender: r.gender } : {}),
    }));
    try {
      const res = await create.mutateAsync(payload);
      if (res.failed.length > 0) {
        setFailures(res.failed);
        // Keep only the failed rows so the admin can fix and resubmit.
        const failedEmails = new Set(res.failed.map((f) => f.email));
        setRows((prev) => prev.filter((r) => failedEmails.has(r.email.trim().toLowerCase())));
      } else {
        reset();
        onDone();
      }
    } catch (err) {
      setError((err as { message?: string }).message ?? "Create failed");
    }
  }

  return { rows, error, failures, create, reset, update, addRow, removeRow, valid, submit };
}
