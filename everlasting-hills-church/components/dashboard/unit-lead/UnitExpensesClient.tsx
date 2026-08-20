"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useUnitLeadContext } from "./useUnitLeadContext";
import { useUnitExpenses, useCreateUnitExpense, useDeleteUnitExpense } from "@/lib/api";
import UnitLeadTabs from "./UnitLeadTabs";
import ExpenseReceiptUpload from "./ExpenseReceiptUpload";
import SubmitButton from "@/components/ui/form/SubmitButton";

function fmtNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function UnitExpensesClient({ unitId }: { unitId: string }) {
  const { summary } = useUnitLeadContext(unitId);
  const { data } = useUnitExpenses(unitId);
  const create = useCreateUnitExpense();
  const del = useDeleteUnitExpense();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (summary === undefined) return null;
  if (!summary) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!title.trim() || !amt || amt <= 0) return;
    setError(null);
    try {
      await create.mutateAsync({
        unitId,
        title: title.trim(),
        amount: amt,
        date,
        description: description.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
      });
      setTitle("");
      setAmount("");
      setDescription("");
      setReceiptUrl("");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't log expense");
    }
  }

  return (
    <div className="space-y-5 mx-auto max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{summary.name}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            A running log of expenses for this unit — no approval needed, just a record for admins to see.
          </p>
        </div>
        {data && (
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmtNaira(data.total)}</p>
          </div>
        )}
      </div>

      <UnitLeadTabs unitId={unitId} active="expenses" />

      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Expenses {data ? `(${data.expenses.length})` : ""}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleCreate} className="space-y-2 p-4 rounded-xl border border-[#87102C]/20 bg-[#87102C]/[0.03]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What was it for?"
                maxLength={140}
                className="sm:col-span-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
              />
              <input
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (₦)"
                className="text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes (optional)"
                maxLength={1000}
                className="text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
              />
            </div>
            <ExpenseReceiptUpload url={receiptUrl} onChange={setReceiptUrl} disabled={create.isPending} />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
                {error}
              </p>
            )}
            <SubmitButton loading={create.isPending} disabled={!title.trim() || !amount} className="px-3 py-2">
              <Plus size={13} className="inline mr-1" /> Log expense
            </SubmitButton>
          </form>

          {data && data.expenses.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
              No expenses logged yet.
            </p>
          )}

          {data && data.expenses.length > 0 && (
            <ul className="space-y-2">
              {data.expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02]"
                >
                  <Wallet size={14} className="text-[#87102C] dark:text-[#e8768a] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {e.category && ` · ${e.category}`}
                      {e.receiptUrl && (
                        <>
                          {" · "}
                          <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-[#87102C] dark:text-[#e8768a] hover:underline">
                            Receipt
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">{fmtNaira(e.amount)}</span>
                  <button
                    type="button"
                    onClick={() => del.mutate({ unitId, expenseId: e.id })}
                    title="Delete expense"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
