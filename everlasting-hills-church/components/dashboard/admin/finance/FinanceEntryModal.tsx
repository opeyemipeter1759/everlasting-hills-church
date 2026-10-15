"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import {
  useCreateFinanceEntry,
  useUpdateFinanceEntry,
  type FinanceEntry,
  type FinanceEntryKind,
} from "@/lib/api/finance";

const KIND_OPTIONS: { value: FinanceEntryKind; label: string }[] = [
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

// Suggestions only — category stays free text so a new fund never needs a code change.
const INCOME_CATEGORY_SUGGESTIONS = ["Building", "Program", "Rent", "Giving"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FinanceEntryModal({
  open,
  onClose,
  entry,
  defaultKind,
}: {
  open: boolean;
  onClose: () => void;
  /** Present when editing an existing entry; absent when creating one. */
  entry?: FinanceEntry | null;
  defaultKind?: FinanceEntryKind;
}) {
  const isEdit = Boolean(entry);
  const [kind, setKind] = useState<FinanceEntryKind>(entry?.kind ?? defaultKind ?? "INCOME");
  const [category, setCategory] = useState(entry?.category ?? "");
  const [label, setLabel] = useState(entry?.label ?? "");
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [date, setDate] = useState(entry ? entry.date.slice(0, 10) : todayIso());
  const [note, setNote] = useState(entry?.note ?? "");

  const create = useCreateFinanceEntry();
  const update = useUpdateFinanceEntry();
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    setKind(entry?.kind ?? defaultKind ?? "INCOME");
    setCategory(entry?.category ?? "");
    setLabel(entry?.label ?? "");
    setAmount(entry ? String(entry.amount) : "");
    setDate(entry ? entry.date.slice(0, 10) : todayIso());
    setNote(entry?.note ?? "");
  }, [open, entry, defaultKind]);

  async function submit() {
    const amountNum = Number(amount);
    if (!category.trim()) return showToast.error("Category is required");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return showToast.error("Enter a valid amount");
    if (!date) return showToast.error("Date is required");

    try {
      if (isEdit && entry) {
        await update.mutateAsync({
          id: entry.id,
          data: { category: category.trim(), label: label.trim() || undefined, amount: amountNum, date, note: note.trim() || undefined },
        });
        showToast.success("Entry updated");
      } else {
        await create.mutateAsync({
          kind,
          category: category.trim(),
          label: label.trim() || undefined,
          amount: amountNum,
          date,
          note: note.trim() || undefined,
        });
        showToast.success(`${kind === "INCOME" ? "Income" : "Expense"} recorded`);
      }
      onClose();
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't save this entry"));
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit entry" : "Record income or expense"}
      subtitle="Category is free text — use whatever fund or expense name fits."
      footer={
        <>
          <button type="button" onClick={onClose} className={btnGhost} disabled={pending}>
            Cancel
          </button>
          <button type="button" onClick={submit} className={btnPrimary} disabled={pending}>
            {pending && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? "Save changes" : "Record entry"}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Type</label>
            <Select aria-label="Type" value={kind} onChange={(next) => setKind(next as FinanceEntryKind)} className={fieldCls} options={KIND_OPTIONS} />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={kind === "INCOME" ? "e.g. Building, Program, Rent, Giving" : "e.g. Utilities, Maintenance"}
            className={fieldCls}
            list="finance-category-suggestions"
          />
          {kind === "INCOME" && (
            <datalist id="finance-category-suggestions">
              {INCOME_CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Label (optional)</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Youth Conference 2026" className={fieldCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Amount (NGN)</label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={fieldCls} />
        </div>
      </div>
    </FormModal>
  );
}
