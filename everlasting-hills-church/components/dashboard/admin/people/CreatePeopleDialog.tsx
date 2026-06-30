"use client";

import { useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import {
  useBulkCreatePeople,
  type CreatePersonInput,
  type PersonRole,
} from "@/lib/api/people";
import { ROLE_LABEL } from "./peopleShared";
import PeopleModal, { btnGhost, btnPrimary, fieldCls } from "./PeopleModal";

interface Row {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "" | "MALE" | "FEMALE";
  role: PersonRole;
}

function emptyRow(role: PersonRole): Row {
  return { firstName: "", lastName: "", email: "", phone: "", gender: "", role };
}

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

  const valid = rows.every(
    (r) =>
      r.firstName.trim() &&
      r.lastName.trim() &&
      /.+@.+\..+/.test(r.email) &&
      r.phone.trim().length >= 6,
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
        setRows(rows.filter((r) => failedEmails.has(r.email.trim().toLowerCase())));
      } else {
        reset();
        onClose();
      }
    } catch (err) {
      setError((err as { message?: string }).message ?? "Create failed");
    }
  }

  return (
    <PeopleModal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add people"
      subtitle="Create one or many at once. The phone number is their initial password — they change it on first login."
      maxWidth="max-w-3xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={() => { reset(); onClose(); }}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} disabled={!valid || create.isPending} onClick={submit}>
            {create.isPending
              ? "Creating…"
              : `Create ${rows.length} ${rows.length === 1 ? "person" : "people"}`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-[#FFF4F6]/40 dark:bg-white/[0.02] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#87102C] text-white text-[11px]">
                  {i + 1}
                </span>
                Person {i + 1}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  aria-label="Remove person"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={fieldCls} placeholder="First name *" value={r.firstName} onChange={(e) => update(i, { firstName: e.target.value })} />
              <input className={fieldCls} placeholder="Last name *" value={r.lastName} onChange={(e) => update(i, { lastName: e.target.value })} />
              <input className={fieldCls} type="email" placeholder="Email *" value={r.email} onChange={(e) => update(i, { email: e.target.value })} />
              <input className={fieldCls} type="tel" placeholder="Phone * (initial password)" value={r.phone} onChange={(e) => update(i, { phone: e.target.value })} />
              <select className={fieldCls} value={r.gender} onChange={(e) => update(i, { gender: e.target.value as Row["gender"] })}>
                <option value="">Gender (optional)</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              <select className={fieldCls} value={r.role} onChange={(e) => update(i, { role: e.target.value as PersonRole })}>
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setRows([...rows, emptyRow(defaultRole)])}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#E7CDD3] dark:border-white/15 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:bg-[#FFF4F6] dark:hover:bg-white/5 transition-colors"
        >
          <Plus size={15} /> Add another person
        </button>

        {failures.length > 0 && (
          <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
            <p className="font-semibold mb-1 inline-flex items-center gap-1">
              <UserPlus size={14} /> {failures.length} could not be created:
            </p>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {failures.map((f) => (
                <li key={f.email}>
                  <strong>{f.email}</strong> — {f.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </PeopleModal>
  );
}
