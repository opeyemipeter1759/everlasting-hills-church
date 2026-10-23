"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import ExpenseReceiptUpload from "@/components/dashboard/unit-lead/ExpenseReceiptUpload";
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
  const [receiptUrl, setReceiptUrl] = useState(entry?.receiptUrl ?? "");

  const create = useCreateFinanceEntry();
  const update = useUpdateFinanceEntry();
  const pending = create.isPending || update.isPending;

  async function submit() {
    const amountNum = Number(amount);
    if (!category.trim()) return showToast.error("Category is required");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return showToast.error("Enter a valid amount");
    if (!date) return showToast.error("Date is required");
    if (kind === "INCOME" && ["tithe", "offering"].includes(category.trim().toLowerCase())) {
      return showToast.error('Tithe and Offering are recorded per service above, not here — use "Record" on the service row instead.');
    }

    try {
      if (isEdit && entry) {
        await update.mutateAsync({
          id: entry.id,
          data: {
            category: category.trim(),
            label: label.trim() || undefined,
            amount: amountNum,
            date,
            note: note.trim() || undefined,
            receiptUrl: receiptUrl.trim() || null,
          },
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
          receiptUrl: receiptUrl.trim() || undefined,
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
          <div className="grid grid-cols-2 gap-2">
            {KIND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                aria-pressed={kind === opt.value}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  kind === opt.value
                    ? opt.value === "INCOME"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-rose-600 bg-rose-600 text-white"
                    : "border-[#E7CDD3] text-gray-600 hover:bg-[#FFF4F6] dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Category</label>
          {kind === "INCOME" && (
            <p className="mb-1.5 text-xs text-gray-400">
              Recording Sunday/Wednesday tithe or offering? Close this and use <span className="font-semibold">Record</span> on that service&apos;s row above instead.
            </p>
          )}
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={kind === "INCOME" ? "e.g. Building, Program, Rent, Giving" : "e.g. Utilities, Maintenance"}
            className={fieldCls}
          />
          {kind === "INCOME" && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {INCOME_CATEGORY_SUGGESTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    category === c
                      ? "border-[#87102C] bg-[#87102C] text-white"
                      : "border-[#E7CDD3] text-gray-600 hover:bg-[#FFF4F6] dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
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
              className={`${fieldCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
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

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Receipt (optional)</label>
          <ExpenseReceiptUpload url={receiptUrl} onChange={setReceiptUrl} disabled={pending} />
        </div>
      </div>
    </FormModal>
  );
}
