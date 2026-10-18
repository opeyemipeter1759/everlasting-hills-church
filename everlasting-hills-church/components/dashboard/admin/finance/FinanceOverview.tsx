"use client";

import { useMemo, useState } from "react";
import { Download, Info, Loader2, Pencil, Plus, RefreshCw, Trash2, Wallet } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import {
  formatNaira,
  useDailyFinanceSummary,
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

type Period = "daily" | "weekly" | "monthly";

const PERIOD_LABELS: Record<Period, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Services run on Nigeria time (WAT, UTC+1); match the backend's WAT-anchored
// week/month boundaries so "today" here lands in the same bucket there does.
const WAT_OFFSET_MS = 60 * 60 * 1000;

function todayIso(): string {
  return new Date(Date.now() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));

// For a UTC scheduledAt instant, the WAT (Nigeria) calendar date — a WAT
// Sunday service is stored at ~23:00 UTC the day before.
const watDateStr = (isoUtc: string) => new Date(new Date(isoUtc).getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);

const serviceDayLabel = (isoUtc: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(new Date(isoUtc).getTime() + WAT_OFFSET_MS),
  );

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
    ...data.services.map((s) => [s.name, watDateStr(s.scheduledAt), s.tithe, s.offering]),
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

/** Entries grouped under each category the summary already totaled, newest first within a group. */
function groupEntries(categories: { category: string; amount: number }[], entries: FinanceEntry[], kind: FinanceEntryKind) {
  return categories.map((c) => ({
    category: c.category,
    total: c.amount,
    items: entries.filter((e) => e.kind === kind && e.category === c.category).sort((a, b) => b.date.localeCompare(a.date)),
  }));
}

export default function FinanceOverview() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [dailyDate, setDailyDate] = useState(todayIso());
  const [weeklyDate, setWeeklyDate] = useState(todayIso());
  const watNow = new Date(Date.now() + WAT_OFFSET_MS);
  const [monthlyYear, setMonthlyYear] = useState(watNow.getUTCFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(watNow.getUTCMonth() + 1);

  const [entryModal, setEntryModal] = useState<{ open: boolean; entry: FinanceEntry | null; defaultKind: FinanceEntryKind }>({
    open: false,
    entry: null,
    defaultKind: "INCOME",
  });
  const [removing, setRemoving] = useState<FinanceEntry | null>(null);

  const daily = useDailyFinanceSummary(period === "daily" ? dailyDate : "");
  const weekly = useWeeklyFinanceSummary(period === "weekly" ? weeklyDate : "");
  const monthly = useMonthlyFinanceSummary(period === "monthly" ? monthlyYear : 0, period === "monthly" ? monthlyMonth : 0);
  const summary = period === "daily" ? daily : period === "weekly" ? weekly : monthly;

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
    if (period === "daily") return shortDate(range.from);
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
  const tiles = !data
    ? []
    : period === "monthly"
      ? [
          { label: "Tithe", caption: "Per service", value: data.titheTotal },
          { label: "Offering", caption: "Per service", value: data.offeringTotal },
          ...data.incomeByCategory.map((c) => ({ label: c.category, caption: "Income", value: c.amount })),
          ...data.expenseByCategory.map((c) => ({ label: c.category, caption: "Expense", value: c.amount })),
        ]
      : [
          { label: "Other income", caption: "Building, Rent, Giving…", value: data.incomeTotal },
          { label: "Expenses", caption: "Everything paid out", value: data.expenseTotal },
        ];

  const incomeGroups = data ? groupEntries(data.incomeByCategory, entries.data ?? [], "INCOME") : [];
  const expenseGroups = data ? groupEntries(data.expenseByCategory, entries.data ?? [], "EXPENSE") : [];

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Finance</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">
            Visible only to Pastor, Finance Head and Super Admin.
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

      <div className="flex items-start gap-3 rounded-2xl border border-[#87102C]/15 bg-[#FFF4F6] p-4 dark:border-[#87102C]/25 dark:bg-[#87102C]/10">
        <Info size={16} className="mt-0.5 shrink-0 text-[#87102C] dark:text-[#e8768a]" aria-hidden="true" />
        <div className="space-y-1 text-sm text-gray-700 dark:text-white/75">
          <p>
            <span className="font-bold">1.</span> After each Sunday or Wednesday service, record its tithe &amp; offering under{" "}
            <span className="font-semibold">Step 1</span> below.
          </p>
          <p>
            <span className="font-bold">2.</span> For anything else — Building fund, Rent, Giving, Special Offering, or an expense —
            use <span className="font-semibold">Add income</span> / <span className="font-semibold">Add expense</span> in{" "}
            <span className="font-semibold">Step 2</span>, any day it happens.
          </p>
          <p className="text-gray-500 dark:text-white/50">You can record daily, weekly, or in one go — totals below always reflect everything entered for the period you&apos;re viewing.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 p-1 dark:border-white/10">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                period === p ? "bg-[#87102C] text-white" : "text-gray-500 hover:bg-gray-50 dark:text-white/50 dark:hover:bg-white/5"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {period === "daily" ? (
          <input
            type="date"
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            className="min-h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        ) : period === "weekly" ? (
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
              className="min-h-10 w-24 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        )}

        {periodLabel && (
          <span className="text-sm font-semibold text-gray-600 dark:text-white/60">
            Showing: {period === "weekly" ? "week of " : ""}
            {periodLabel}
          </span>
        )}
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
            {period !== "monthly" && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Tithe &amp; offering per service</p>
                {data.services.length === 0 ? (
                  <p className="text-sm text-gray-400">No service in this period.</p>
                ) : (
                  <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {data.services.map((s) => (
                      <div key={s.id} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/65">
                          <Wallet size={14} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
                          {serviceDayLabel(s.scheduledAt)}
                        </dt>
                        <dd className="mt-1.5 text-sm font-bold tabular-nums text-[#111] dark:text-white">
                          Tithe: {formatNaira(s.tithe ?? 0)}
                        </dd>
                        <dd className="text-sm font-bold tabular-nums text-[#111] dark:text-white">
                          Offering: {formatNaira(s.offering ?? 0)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {tiles.map(({ label, caption, value }) => (
                <div key={label} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/65">
                    <Wallet size={14} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
                    {label}
                  </dt>
                  <dd className="mt-1.5 break-words text-xl font-black tabular-nums text-[#111] dark:text-white sm:text-2xl">
                    {formatNaira(value)}
                  </dd>
                  <p className="mt-0.5 text-[11px] text-gray-400">{caption}</p>
                </div>
              ))}
              <div className="min-w-0 rounded-2xl border border-[#f2b84b]/60 bg-[#fff8e8] p-4 dark:border-[#f2b84b]/25 dark:bg-[#f2b84b]/10">
                <dt className="text-xs font-semibold text-gray-600 dark:text-white/65">Net total</dt>
                <dd className="mt-1.5 break-words text-xl font-black tabular-nums text-[#111] dark:text-white sm:text-2xl">
                  {formatNaira(data.netTotal)}
                </dd>
                <p className="mt-0.5 text-[11px] text-gray-400">Income minus expenses</p>
              </div>
            </dl>

            <section>
              <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                Totals by category
              </h2>
              <p className="mb-3 text-xs text-gray-400">
                {period === "daily" ? "Today" : period === "weekly" ? "This week" : "This month"}, summed up — Tithe, Offering, and
                everything else by category.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Income</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-white/80">Tithe</span>
                      <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(data.titheTotal)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-white/80">Offering</span>
                      <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(data.offeringTotal)}</span>
                    </li>
                    {data.incomeByCategory.map((c) => (
                      <li key={c.category} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-white/80">{c.category}</span>
                        <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(c.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Expenses</p>
                  {data.expenseByCategory.length === 0 ? (
                    <p className="text-sm text-gray-400">No expenses recorded.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {data.expenseByCategory.map((c) => (
                        <li key={c.category} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-white/80">{c.category}</span>
                          <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(c.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {period !== "monthly" && (
              <>
                <section>
                  <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                    Step 1 · Tithe &amp; offering by service
                  </h2>
                  <p className="mb-3 text-xs text-gray-400">Enter what was counted for each service as soon as it&apos;s ready.</p>
                  {data.services.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
                      No services in this period.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.services.map((s) => (
                        <ServiceOfferingRow key={s.id} service={s} />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                        Step 2 · Other income &amp; expenses
                      </h2>
                      <p className="text-xs text-gray-400">Building, Rent, Giving, Special Offering, or any expense — not tithe/offering.</p>
                    </div>
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
                    <div className="mt-3 space-y-1.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                      ))}
                    </div>
                  ) : incomeGroups.length === 0 && expenseGroups.length === 0 ? (
                    <p className="mt-3 rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
                      No income or expenses recorded for this period yet.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <EntryGroupList
                        title="Income"
                        groups={incomeGroups}
                        onEdit={(e) => setEntryModal({ open: true, entry: e, defaultKind: e.kind })}
                        onDelete={setRemoving}
                      />
                      <EntryGroupList
                        title="Expenses"
                        groups={expenseGroups}
                        onEdit={(e) => setEntryModal({ open: true, entry: e, defaultKind: e.kind })}
                        onDelete={setRemoving}
                      />
                    </div>
                  )}
                </section>
              </>
            )}
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

function EntryGroupList({
  title,
  groups,
  onEdit,
  onDelete,
}: {
  title: string;
  groups: { category: string; total: number; items: FinanceEntry[] }[];
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
        No {title.toLowerCase()} yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
      {groups.map((g) => (
        <div key={g.category} className="rounded-2xl border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between rounded-t-2xl bg-gray-50 px-3.5 py-2 dark:bg-white/5">
            <span className="text-sm font-bold text-gray-800 dark:text-white/85">{g.category}</span>
            <span className="text-sm font-black tabular-nums text-gray-900 dark:text-white">{formatNaira(g.total)}</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {g.items.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-800 dark:text-white/80">{e.label || "—"}</p>
                  <p className="text-xs text-gray-400">{shortDate(e.date)}{e.note ? ` · ${e.note}` : ""}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{formatNaira(e.amount)}</span>
                <button
                  type="button"
                  onClick={() => onEdit(e)}
                  aria-label={`Edit ${e.category} entry`}
                  className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/5"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(e)}
                  aria-label={`Delete ${e.category} entry`}
                  className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
