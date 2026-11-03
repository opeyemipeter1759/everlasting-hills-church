"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import ExpenseReceiptUpload from "@/components/dashboard/unit-lead/ExpenseReceiptUpload";
import {
  useCreateFinanceEntry,
  useUpdateFinanceEntry,
  type FinanceEntry,
  type FinanceEntryFrequency,
  type FinanceEntryKind,
} from "@/lib/api/finance";

const INK = "text-[#2B2420] dark:text-white";
const SUBINK = "text-[#8A7F72] dark:text-white/45";
const RULE = "border-[#E4D6C7] dark:border-white/10";

const KIND_OPTIONS: { value: FinanceEntryKind; label: string }[] = [
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

const FREQUENCY_OPTIONS: { value: FinanceEntryFrequency; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONE_TIME", label: "One-time" },
];

// Suggestions only — category stays free text so a new fund never needs a code change.
const INCOME_CATEGORY_SUGGESTIONS = ["Tithe", "Offering", "Building", "Program", "Rent", "Giving", "Special offering", "Project contribution"];
const EXPENSE_CATEGORY_SUGGESTIONS = ["Fuel", "Welfare", "Sanitation", "Utilities", "Maintenance"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const fieldLabelCls = `mb-1.5 block text-[11px] font-bold uppercase tracking-wider ${SUBINK}`;
const fieldCls = `w-full rounded-xl border ${RULE} bg-white px-3 py-2.5 text-sm ${INK} outline-none focus:border-[#87102C] dark:bg-white/[0.04]`;

export default function FinanceEntryForm({
  entry,
  onDoneEditing,
}: {
  /** The entry currently being edited, or null when recording a fresh one. */
  entry: FinanceEntry | null;
  onDoneEditing: () => void;
}) {
  const isEdit = Boolean(entry);
  const [kind, setKind] = useState<FinanceEntryKind>("INCOME");
  const [category, setCategory] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [frequency, setFrequency] = useState<FinanceEntryFrequency>("ONE_TIME");
  const [note, setNote] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  // Load the entry being edited into the form; reset to a blank one-time
  // entry once editing ends.
  useEffect(() => {
    setKind(entry?.kind ?? "INCOME");
    setCategory(entry?.category ?? "");
    setLabel(entry?.label ?? "");
    setAmount(entry ? String(entry.amount) : "");
    setDate(entry ? entry.date.slice(0, 10) : todayIso());
    setFrequency(entry?.frequency ?? "ONE_TIME");
    setNote(entry?.note ?? "");
    setReceiptUrl(entry?.receiptUrl ?? "");
  }, [entry]);

  const create = useCreateFinanceEntry();
  const update = useUpdateFinanceEntry();
  const pending = create.isPending || update.isPending;

  async function submit() {
    const amountNum = Number(amount);
    if (!category.trim()) return showToast.error("Category is required");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return showToast.error("Enter a valid amount");
    if (!date) return showToast.error("Date is required");

    try {
      if (isEdit && entry) {
        await update.mutateAsync({
          id: entry.id,
          data: {
            category: category.trim(),
            label: label.trim() || undefined,
            amount: amountNum,
            date,
            frequency,
            note: note.trim() || undefined,
            receiptUrl: receiptUrl.trim() || null,
          },
        });
        showToast.success("Entry updated");
        onDoneEditing();
      } else {
        await create.mutateAsync({
          kind,
          category: category.trim(),
          label: label.trim() || undefined,
          amount: amountNum,
          date,
          frequency,
          note: note.trim() || undefined,
          receiptUrl: receiptUrl.trim() || undefined,
        });
        showToast.success(`${kind === "INCOME" ? "Income" : "Expense"} recorded`);
        setCategory("");
        setLabel("");
        setAmount("");
        setNote("");
        setReceiptUrl("");
      }
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't save this entry"));
    }
  }

  const categorySuggestions = kind === "INCOME" ? INCOME_CATEGORY_SUGGESTIONS : EXPENSE_CATEGORY_SUGGESTIONS;

  return (
    <div className={`rounded-2xl border ${RULE} bg-white p-4 sm:p-6 dark:bg-white/[0.02]`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={`text-[15px] font-semibold ${INK}`}>Record entry</h2>
          <p className={`mt-0.5 text-xs ${SUBINK}`}>Choose income or expense, pick a category, enter the amount, save.</p>
        </div>
        {isEdit ? (
          <button
            type="button"
            onClick={onDoneEditing}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#B9862E]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8A6420] hover:bg-[#B9862E]/20 dark:text-amber-300"
          >
            Editing <X size={11} aria-hidden="true" />
          </button>
        ) : (
          <span className="shrink-0 rounded-full bg-[#87102C]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#87102C] dark:bg-[#e8768a]/10 dark:text-[#e8768a]">
            New entry
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-2">
            {KIND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setKind(opt.value);
                  setCategory("");
                }}
                aria-pressed={kind === opt.value}
                className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                  kind === opt.value
                    ? opt.value === "INCOME"
                      ? "border-[#2F6B4F] bg-[#2F6B4F] text-white"
                      : "border-[#9C3B30] bg-[#9C3B30] text-white"
                    : `${RULE} text-gray-600 hover:bg-[#FBF6EF] dark:text-white/60 dark:hover:bg-white/5`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className={fieldLabelCls}>Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={kind === "INCOME" ? "e.g. Building, Program, Rent, Giving" : "e.g. Fuel, Welfare, Utilities"}
            className={fieldCls}
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {categorySuggestions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  category === c
                    ? "border-[#87102C] bg-[#87102C] text-white"
                    : `${RULE} text-gray-600 hover:bg-[#FBF6EF] dark:text-white/60 dark:hover:bg-white/5`
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={fieldLabelCls}>How often</label>
          <div className="flex flex-wrap gap-1.5">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                aria-pressed={frequency === opt.value}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  frequency === opt.value
                    ? "border-[#B9862E] bg-[#B9862E] text-[#2B2420]"
                    : `${RULE} text-gray-600 hover:bg-[#FBF6EF] dark:text-white/60 dark:hover:bg-white/5`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={fieldLabelCls}>Label (optional)</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Youth Conference 2026" className={fieldCls} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={fieldLabelCls}>Amount (₦)</label>
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
            <label className={fieldLabelCls}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className={fieldLabelCls}>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sunday collection" className={fieldCls} />
          </div>
        </div>

        <div>
          <label className={fieldLabelCls}>Receipt (optional)</label>
          <ExpenseReceiptUpload url={receiptUrl} onChange={setReceiptUrl} disabled={pending} />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B9862E] text-sm font-bold text-[#2B2420] hover:bg-[#a6761f] disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {isEdit ? "Save changes" : "Save entry"}
        </button>
      </div>
    </div>
  );
}
