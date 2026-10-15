"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Pencil, Plus, RefreshCw, Trash2, Wallet } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import {
  formatNaira,
  useDeleteFinanceEntry,
  useFinanceEntries,
  useMonthlyFinanceSummary,
  useWeeklyFinanceSummary,
  type FinanceEntry,
  type FinanceEntryKind,
  type FinanceSummary,
} from "@/lib/api/finance";
import ServiceOfferingRow from "./ServiceOfferingRow";
import FinanceEntryModal from "./FinanceEntryModal";

type Period = "weekly" | "monthly";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));

function csvCell(value: string | number | null) {
  let text = value == null ? "" : String(value);
  // A cell starting with = or @ is a formula to a spreadsheet.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function financeCsv(data: FinanceSummary, entries: FinanceEntry[]): string {
  const rows: (string | number | null)[][] = [
    ["Tithe & offering by service"],
    ["Service", "Date", "Tithe (NGN)", "Offering (NGN)"],
    ...data.services.map((s) => [s.name, s.scheduledAt.slice(0, 10), s.tithe, s.offering]),
    [],
    ["Income & expense entries"],
    ["Type", "Category", "Label", "Amount (NGN)", "Date", "Note"],
    ...entries.map((e) => [e.kind === "INCOME" ? "Income" : "Expense", e.category, e.label, e.amount, e.date.slice(0, 10), e.note]),
    [],
    ["Totals"],
    ["Tithe", data.titheTotal],
    ["Offering", data.offeringTotal],
    ["Other income", data.incomeTotal],
    ["Grand income", data.grandIncomeTotal],
    ["Expenses", data.expenseTotal],
    ["Net total", data.netTotal],
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadFinanceCsv(data: FinanceSummary, entries: FinanceEntry[], periodLabel: string) {
  const url = URL.createObjectURL(new Blob([financeCsv(data, entries)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `finance-${periodLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function FinanceOverview() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [weeklyDate, setWeeklyDate] = useState(todayIso());
  const now = new Date();
  const [monthlyYear, setMonthlyYear] = useState(now.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(now.getMonth() + 1);

  const [entryModal, setEntryModal] = useState<{ open: boolean; entry: FinanceEntry | null; defaultKind: FinanceEntryKind }>({
    open: false,
    entry: null,
    defaultKind: "INCOME",
  });
  const [removing, setRemoving] = useState<FinanceEntry | null>(null);

  const weekly = useWeeklyFinanceSummary(period === "weekly" ? weeklyDate : "");
  const monthly = useMonthlyFinanceSummary(period === "monthly" ? monthlyYear : 0, period === "monthly" ? monthlyMonth : 0);
  const summary = period === "weekly" ? weekly : monthly;

  const range = summary.data?.range;
  const entries = useFinanceEntries(range ? { from: range.from, to: range.to } : {});
  const deleteEntry = useDeleteFinanceEntry();

  const refresh = () => {
    summary.refetch();
    entries.refetch();
  };

  const periodLabel = useMemo(() => {
    if (period === "monthly") return `${MONTH_LABELS[monthlyMonth - 1]} ${monthlyYear}`;
    if (!range) return "";
    return `${shortDate(range.from)} – ${shortDate(range.to)}`;
  }, [period, monthlyMonth, monthlyYear, range]);

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deleteEntry.mutateAsync(removing.id);
      showToast.success("Entry deleted");
      setRemoving(null);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't delete this entry"));
    }
  }

  const data = summary.data;
  const tiles = data
    ? [
        { label: "Tithe", value: data.titheTotal },
        { label: "Offering", value: data.offeringTotal },
        { label: "Other income", value: data.incomeTotal },
        { label: "Expenses", value: data.expenseTotal },
      ]
    : [];

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Finance</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">
            Tithe &amp; offering per service, building/program/rent/giving income, and expenses — visible only to Pastor, Finance Head and Super Admin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => data && downloadFinanceCsv(data, entries.data ?? [], periodLabel || period)}
            disabled={!data}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-3.5 text-sm font-semibold text-white hover:bg-[#6f0d24] disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={summary.isFetching || entries.isFetching}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            {summary.isFetching || entries.isFetching ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={15} aria-hidden="true" />
            )}
            Refresh
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 p-1 dark:border-white/10">
          {(["weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                period === p ? "bg-[#87102C] text-white" : "text-gray-500 hover:bg-gray-50 dark:text-white/50 dark:hover:bg-white/5"
              }`}
            >
              {p === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>

        {period === "weekly" ? (
          <input
            type="date"
            value={weeklyDate}
            onChange={(e) => setWeeklyDate(e.target.value)}
            className="min-h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(Number(e.target.value))}
              className="min-h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {MONTH_LABELS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(Number(e.target.value))}
              className="min-h-10 w-24 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        )}

        {periodLabel && <span className="text-xs font-semibold text-gray-400">{periodLabel}</span>}
      </div>

      {summary.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : summary.isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
          Finance data could not load.{" "}
          <button type="button" onClick={() => summary.refetch()} className="min-h-11 font-semibold underline">
            Try again
          </button>
        </div>
      ) : (
        data && (
          <>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {tiles.map(({ label, value }, index) => (
                <div key={label} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/65">
                    <Wallet size={14} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
                    {label}
                  </dt>
                  <dd className="mt-1.5 break-words text-xl font-black tabular-nums text-[#111] dark:text-white sm:text-2xl">
                    {formatNaira(value)}
                  </dd>
                </div>
              ))}
              <div className="min-w-0 rounded-2xl border border-[#f2b84b]/60 bg-[#fff8e8] p-4 dark:border-[#f2b84b]/25 dark:bg-[#f2b84b]/10">
                <dt className="text-xs font-semibold text-gray-600 dark:text-white/65">Net total</dt>
                <dd className="mt-1.5 break-words text-xl font-black tabular-nums text-[#111] dark:text-white sm:text-2xl">
                  {formatNaira(data.netTotal)}
                </dd>
              </div>
            </dl>

            {(data.incomeByCategory.length > 0 || data.expenseByCategory.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.incomeByCategory.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Income by category</p>
                    <ul className="space-y-1.5">
                      {data.incomeByCategory.map((c) => (
                        <li key={c.category} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-white/80">{c.category}</span>
                          <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(c.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.expenseByCategory.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Expenses by category</p>
                    <ul className="space-y-1.5">
                      {data.expenseByCategory.map((c) => (
                        <li key={c.category} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-white/80">{c.category}</span>
                          <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(c.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <section>
              <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                Tithe &amp; offering by service
              </h2>
              {data.services.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
                  No services in this period.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-white/50">
                      <tr>
                        <th scope="col" className="px-4 py-3">Service</th>
                        <th scope="col" className="px-4 py-3 text-right">Tithe</th>
                        <th scope="col" className="px-4 py-3 text-right">Offering</th>
                        <th scope="col" className="px-4 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {data.services.map((s) => (
                        <ServiceOfferingRow key={s.id} service={s} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Income &amp; expense entries</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryModal({ open: true, entry: null, defaultKind: "INCOME" })}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6E0C24]"
                  >
                    <Plus size={13} /> Add income
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryModal({ open: true, entry: null, defaultKind: "EXPENSE" })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                  >
                    <Plus size={13} /> Add expense
                  </button>
                </div>
              </div>

              {entries.isLoading ? (
                <div className="space-y-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                  ))}
                </div>
              ) : (entries.data ?? []).length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
                  No entries recorded for this period yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {(entries.data ?? []).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-2.5 dark:border-white/10"
                    >
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          e.kind === "INCOME"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        }`}
                      >
                        {e.kind === "INCOME" ? "Income" : "Expense"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {e.category}
                          {e.label ? ` — ${e.label}` : ""}
                        </p>
                        <p className="text-xs text-gray-400">{shortDate(e.date)}</p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(e.amount)}</span>
                      <button
                        type="button"
                        onClick={() => setEntryModal({ open: true, entry: e, defaultKind: e.kind })}
                        aria-label={`Edit ${e.category}`}
                        className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/5"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoving(e)}
                        aria-label={`Delete ${e.category}`}
                        className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      )}

      <FinanceEntryModal
        open={entryModal.open}
        onClose={() => setEntryModal((s) => ({ ...s, open: false }))}
        entry={entryModal.entry}
        defaultKind={entryModal.defaultKind}
      />

      <ConfirmDialog
        open={!!removing}
        title="Delete this entry?"
        description={removing ? `${removing.category}${removing.label ? ` — ${removing.label}` : ""} (${formatNaira(removing.amount)}) will be removed.` : ""}
        confirmLabel="Yes, delete"
        tone="danger"
        loading={deleteEntry.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
