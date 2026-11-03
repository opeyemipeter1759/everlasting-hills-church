"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Paperclip, Pencil, RefreshCw, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { api } from "@/lib/api/request";
import { userMessageForError } from "@/lib/api/user-message";
import {
  formatNaira,
  useAllTimeFinanceSummary,
  useDailyFinanceSummary,
  useDeleteFinanceEntry,
  useFinanceEntries,
  useMonthlyFinanceSummary,
  useWeeklyFinanceSummary,
  type FinanceEntry,
  type FinanceEntryFrequency,
  type FinanceSummary,
} from "@/lib/api/finance";
import FinanceEntryForm from "./FinanceEntryForm";

type Period = "daily" | "weekly" | "monthly" | "all";

const PERIOD_LABELS: Record<Period, string> = { daily: "Today", weekly: "This week", monthly: "This month", all: "All" };
const FREQUENCY_LABELS: Record<FinanceEntryFrequency, string> = {
  ONE_TIME: "One-time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};
const SHEET_COLUMNS = ["A", "B", "C", "D", "E", "F", "G"];

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const RULE = "border-[#E4D6C7] dark:border-white/10";
const INK = "text-[#2B2420] dark:text-white";
const SUBINK = "text-[#8A7F72] dark:text-white/45";
const CREDIT = "text-[#2F6B4F] dark:text-emerald-300";
const DEBIT = "text-[#9C3B30] dark:text-rose-300";

// Services run on Nigeria time (WAT, UTC+1); match the backend's WAT-anchored
// week/month boundaries so "today" here lands in the same bucket there does.
const WAT_OFFSET_MS = 60 * 60 * 1000;

function todayIso(): string {
  return new Date(Date.now() + WAT_OFFSET_MS).toISOString().slice(0, 10);
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
    ["Income & expense entries"],
    ["Type", "Category", "Label", "Frequency", "Amount (NGN)", "Date", "Note", "Receipt"],
    ...entries.map((e) => [
      e.kind === "INCOME" ? "Income" : "Expense",
      e.category,
      e.label,
      FREQUENCY_LABELS[e.frequency],
      e.amount,
      e.date.slice(0, 10),
      e.note,
      e.receiptUrl ?? "",
    ]),
    [],
    ["Totals"],
    ["Income", data.grandIncomeTotal],
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
  const [dailyDate, setDailyDate] = useState(todayIso());
  const [weeklyDate, setWeeklyDate] = useState(todayIso());
  const watNow = new Date(Date.now() + WAT_OFFSET_MS);
  const [monthlyYear, setMonthlyYear] = useState(watNow.getUTCFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(watNow.getUTCMonth() + 1);

  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [removing, setRemoving] = useState<FinanceEntry | null>(null);
  const [search, setSearch] = useState("");

  // Exports a chosen month's sheet independent of whatever period is on
  // screen — fetched on demand, not tied to the page's own period state.
  const [exportMonth, setExportMonth] = useState(watNow.getUTCMonth() + 1);
  const [exportYear, setExportYear] = useState(watNow.getUTCFullYear());
  const [exporting, setExporting] = useState(false);

  const daily = useDailyFinanceSummary(period === "daily" ? dailyDate : "");
  const weekly = useWeeklyFinanceSummary(period === "weekly" ? weeklyDate : "");
  const monthly = useMonthlyFinanceSummary(period === "monthly" ? monthlyYear : 0, period === "monthly" ? monthlyMonth : 0);
  const allTime = useAllTimeFinanceSummary(period === "all");
  const summary = period === "daily" ? daily : period === "weekly" ? weekly : period === "monthly" ? monthly : allTime;

  const range = summary.data?.range;
  const entries = useFinanceEntries(range ? { from: range.from, to: range.to } : {});
  const deleteEntry = useDeleteFinanceEntry();

  const refresh = () => {
    summary.refetch();
    entries.refetch();
  };

  const periodLabel = useMemo(() => {
    if (period === "all") return "All time";
    if (period === "monthly") return `${MONTH_LABELS[monthlyMonth - 1]} ${monthlyYear}`;
    if (!range) return "";
    if (period === "daily") return shortDate(range.from);
    return `${shortDate(range.from)} – ${shortDate(range.to)}`;
  }, [period, monthlyMonth, monthlyYear, range]);

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deleteEntry.mutateAsync(removing.id);
      showToast.success("Entry deleted");
      if (editingEntry?.id === removing.id) setEditingEntry(null);
      setRemoving(null);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't delete this entry"));
    }
  }

  /** Exports whichever month is picked, regardless of the period currently on screen. */
  async function handleExportMonth() {
    setExporting(true);
    try {
      const monthSummary = await api.get<FinanceSummary>("/finance/summary/monthly", { year: exportYear, month: exportMonth });
      const monthEntries = await api.get<FinanceEntry[]>("/finance/entries", { from: monthSummary.range.from, to: monthSummary.range.to });
      downloadFinanceCsv(monthSummary, monthEntries, `${MONTH_LABELS[exportMonth - 1]} ${exportYear}`);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't export that month"));
    } finally {
      setExporting(false);
    }
  }

  const data = summary.data;

  const sheetRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = entries.data ?? [];
    if (!term) return rows;
    return rows.filter(
      (e) =>
        e.category.toLowerCase().includes(term) ||
        (e.label ?? "").toLowerCase().includes(term) ||
        (e.note ?? "").toLowerCase().includes(term),
    );
  }, [entries.data, search]);

  const sheetIncomeTotal = sheetRows.filter((e) => e.kind === "INCOME").reduce((sum, e) => sum + e.amount, 0);
  const sheetExpenseTotal = sheetRows.filter((e) => e.kind === "EXPENSE").reduce((sum, e) => sum + e.amount, 0);

  const titheOfferingTotal = data
    ? data.incomeByCategory
        .filter((c) => ["tithe", "offering"].includes(c.category.trim().toLowerCase()))
        .reduce((sum, c) => sum + c.amount, 0)
    : 0;

  const statCards = data
    ? [
        { label: "Income", value: data.grandIncomeTotal, hint: "All income sources" },
        { label: "Expenses", value: data.expenseTotal, hint: "Fuel, welfare, maintenance" },
        { label: "Net", value: data.netTotal, hint: "Income minus expenses", highlight: true },
        { label: "Tithe & offering", value: titheOfferingTotal, hint: "Recorded through Record entry" },
      ]
    : [];

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B9862E]">Everlasting Hills · Finance</p>
          <h1 className={`mt-1 font-serif text-3xl font-semibold sm:text-[34px] ${INK}`}>Ledger</h1>
          <p className={`mt-1 max-w-xl text-sm ${SUBINK}`}>
            Choose income or expense, pick a category, enter the amount, save.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className={`inline-flex flex-wrap items-center gap-1 rounded-full border ${RULE} bg-white p-1 dark:bg-white/[0.02]`}>
            {(["daily", "weekly", "monthly", "all"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  period === p ? "bg-[#B9862E] text-[#2B2420]" : `${SUBINK} hover:text-[#2B2420] dark:hover:text-white`
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={summary.isFetching || entries.isFetching}
            aria-label="Refresh"
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border ${RULE} text-[#5b5047] hover:bg-[#FBF6EF] disabled:opacity-60 dark:text-white/70 dark:hover:bg-white/5`}
          >
            {summary.isFetching || entries.isFetching ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={15} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {period !== "all" && (
        <div className="flex flex-wrap items-center gap-2">
          {period === "daily" ? (
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className={`min-h-10 rounded-xl border ${RULE} bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:bg-white/5 dark:text-white`}
            />
          ) : period === "weekly" ? (
            <input
              type="date"
              value={weeklyDate}
              onChange={(e) => setWeeklyDate(e.target.value)}
              className={`min-h-10 rounded-xl border ${RULE} bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:bg-white/5 dark:text-white`}
            />
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                className={`min-h-10 rounded-xl border ${RULE} bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:bg-white/5 dark:text-white`}
              >
                {MONTH_LABELS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(Number(e.target.value))}
                className={`min-h-10 w-24 rounded-xl border ${RULE} bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:bg-white/5 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
          )}
          {periodLabel && (
            <p className={`text-sm ${SUBINK}`}>
              {period === "weekly" ? "Week of " : ""}
              {periodLabel}
            </p>
          )}
        </div>
      )}

      {summary.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-24 animate-pulse rounded-2xl border ${RULE} bg-[#E4D6C7]/20 dark:bg-white/5`} />
          ))}
        </div>
      ) : summary.isError ? (
        <div role="alert" className={`rounded-2xl border border-red-200 p-5 text-sm ${INK} dark:border-red-900`}>
          Finance data could not load.{" "}
          <button type="button" onClick={() => summary.refetch()} className="min-h-11 font-semibold underline">
            Try again
          </button>
        </div>
      ) : (
        data && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl border p-4 ${s.highlight ? "border-[#B9862E] bg-[#B9862E]/5" : `${RULE} bg-white dark:bg-white/[0.02]`}`}
                >
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${SUBINK}`}>{s.label}</p>
                  <p className={`mt-1.5 font-serif text-2xl font-semibold tabular-nums sm:text-[28px] ${s.highlight ? "text-[#8A6420] dark:text-amber-300" : INK}`}>
                    {formatNaira(s.value)}
                  </p>
                  <p className={`mt-1 text-xs ${SUBINK}`}>{s.hint}</p>
                </div>
              ))}
            </div>

            {/* Record entry — Tithe, Offering, and everything else: Building, Rent, Giving, Special offering, expenses. */}
            <FinanceEntryForm entry={editingEntry} onDoneEditing={() => setEditingEntry(null)} />

            {/* Sheet — every entry in this period, laid out like a spreadsheet. */}
            <section className={`rounded-2xl border ${RULE} bg-white p-4 sm:p-6 dark:bg-white/[0.02]`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className={`text-[15px] font-semibold ${INK}`}>Sheet</h2>
                  <p className={`mt-0.5 text-xs ${SUBINK}`}>Every entry in this period, laid out like a spreadsheet.</p>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search category or note"
                  className={`min-h-10 w-full max-w-[220px] rounded-xl border ${RULE} bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:bg-white/5 dark:text-white`}
                />
              </div>

              <div className={`mt-3 flex flex-col gap-2 border-t ${RULE} pt-3 sm:flex-row sm:flex-wrap sm:items-center`}>
                <span className={`text-xs font-semibold ${SUBINK}`}>Export a specific month:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(Number(e.target.value))}
                    className={`min-h-10 flex-1 basis-[9.5rem] rounded-lg border ${RULE} bg-white px-2.5 text-xs outline-none focus:border-[#87102C] dark:bg-white/5 dark:text-white sm:min-h-9 sm:flex-none sm:basis-auto`}
                  >
                    {MONTH_LABELS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={exportYear}
                    onChange={(e) => setExportYear(Number(e.target.value))}
                    className={`min-h-10 w-24 shrink-0 rounded-lg border ${RULE} bg-white px-2.5 text-xs outline-none focus:border-[#87102C] dark:bg-white/5 dark:text-white sm:min-h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                  <button
                    type="button"
                    onClick={handleExportMonth}
                    disabled={exporting}
                    className={`inline-flex min-h-10 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg border ${RULE} px-3 text-xs font-semibold ${INK} hover:bg-[#FBF6EF] disabled:opacity-60 dark:hover:bg-white/5 sm:min-h-9 sm:flex-none`}
                  >
                    {exporting ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Download size={12} aria-hidden="true" />}
                    Export
                  </button>
                </div>
              </div>

              {entries.isLoading ? (
                <div className="mt-4 space-y-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-10 animate-pulse rounded-lg ${RULE} border bg-[#E4D6C7]/20 dark:bg-white/5`} />
                  ))}
                </div>
              ) : sheetRows.length === 0 ? (
                <p className={`mt-4 rounded-xl border border-dashed ${RULE} px-4 py-6 text-center text-sm ${SUBINK}`}>
                  No entries match this view yet.
                </p>
              ) : (
                <div className={`mt-4 overflow-x-auto rounded-xl border ${RULE}`}>
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className={`border-b ${RULE} text-[10px] font-semibold uppercase tracking-wide text-gray-300 dark:text-white/15`}>
                        {SHEET_COLUMNS.map((letter) => (
                          <th key={letter} className="px-4 py-1 font-normal">{letter}</th>
                        ))}
                        <th className="px-4 py-1" />
                      </tr>
                      <tr className={`border-b ${RULE} text-xs font-semibold uppercase tracking-wide ${SUBINK}`}>
                        <th className="px-4 py-2.5">#</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Frequency</th>
                        <th className="px-4 py-2.5">Amount (₦)</th>
                        <th className="px-4 py-2.5">Note</th>
                        <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-[#E4D6C7] dark:divide-white/10`}>
                      <tr className={`${INK} font-semibold`}>
                        <td className="px-4 py-2.5" colSpan={5}>Income total</td>
                        <td className={`px-4 py-2.5 tabular-nums ${CREDIT}`}>{formatNaira(sheetIncomeTotal)}</td>
                        <td className="px-4 py-2.5" colSpan={2} />
                      </tr>
                      <tr className={`${INK} font-semibold`}>
                        <td className="px-4 py-2.5" colSpan={5}>Expense total</td>
                        <td className={`px-4 py-2.5 tabular-nums ${DEBIT}`}>{formatNaira(sheetExpenseTotal)}</td>
                        <td className="px-4 py-2.5" colSpan={2} />
                      </tr>
                      {sheetRows.map((e, i) => (
                        <tr key={e.id} className="align-top text-gray-700 dark:text-white/80">
                          <td className={`px-4 py-2.5 tabular-nums ${SUBINK}`}>{i + 1}</td>
                          <td className="px-4 py-2.5 tabular-nums">{shortDate(e.date)}</td>
                          <td className={`px-4 py-2.5 font-semibold ${e.kind === "INCOME" ? CREDIT : DEBIT}`}>
                            {e.kind === "INCOME" ? "Income" : "Expense"}
                          </td>
                          <td className={`px-4 py-2.5 font-medium ${INK}`}>
                            <span className="flex items-center gap-1.5">
                              {e.category}
                              {e.receiptUrl && (
                                <a
                                  href={e.receiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label="View receipt"
                                  className={`shrink-0 ${SUBINK} hover:text-[#87102C] dark:hover:text-[#e8768a]`}
                                >
                                  <Paperclip size={12} />
                                </a>
                              )}
                            </span>
                            {e.label && <span className={`block text-xs ${SUBINK}`}>{e.label}</span>}
                          </td>
                          <td className={`px-4 py-2.5 ${SUBINK}`}>{FREQUENCY_LABELS[e.frequency]}</td>
                          <td className={`px-4 py-2.5 font-semibold tabular-nums ${e.kind === "INCOME" ? CREDIT : DEBIT}`}>
                            {e.kind === "INCOME" ? "+" : "–"}{formatNaira(e.amount)}
                          </td>
                          <td className={`px-4 py-2.5 ${SUBINK}`}>{e.note || "—"}</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingEntry(e)}
                                aria-label={`Edit ${e.category} entry`}
                                className="rounded-lg p-1.5 text-[#C9BBAC] hover:bg-[#FBF6EF] hover:text-[#5b5047] dark:hover:bg-white/5"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemoving(e)}
                                aria-label={`Delete ${e.category} entry`}
                                className="rounded-lg p-1.5 text-[#C9BBAC] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
      )}

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
