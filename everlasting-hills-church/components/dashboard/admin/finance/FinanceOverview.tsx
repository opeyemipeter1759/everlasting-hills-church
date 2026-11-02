"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, Loader2, Paperclip, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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

// A hairline ledger rule, used in place of card borders throughout.
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

// For a UTC scheduledAt instant, the WAT (Nigeria) calendar date — a WAT
// Sunday service is stored at ~23:00 UTC the day before.
const watDateStr = (isoUtc: string) => new Date(new Date(isoUtc).getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);

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
    ["Type", "Category", "Label", "Amount (NGN)", "Date", "Note", "Receipt"],
    ...entries.map((e) => [
      e.kind === "INCOME" ? "Income" : "Expense",
      e.category,
      e.label,
      e.amount,
      e.date.slice(0, 10),
      e.note,
      e.receiptUrl ?? "",
    ]),
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
  const incomeGroups = data ? groupEntries(data.incomeByCategory, entries.data ?? [], "INCOME") : [];
  const expenseGroups = data ? groupEntries(data.expenseByCategory, entries.data ?? [], "EXPENSE") : [];

  const ledgerStats = data
    ? [
        { label: "Tithe", value: data.titheTotal },
        { label: "Offering", value: data.offeringTotal },
        { label: "Other income", value: data.incomeTotal },
        { label: "Expenses", value: data.expenseTotal },
      ]
    : [];

  return (
    <div className="space-y-5 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-[28px] font-semibold text-[#2B2420] dark:text-white">Finance Ledger</h1>
          <p className={`mt-1 max-w-xl text-sm ${SUBINK}`}>Visible only to the Pastor and Finance Head.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => data && downloadFinanceCsv(data, entries.data ?? [], periodLabel || period)}
            disabled={!data}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-3.5 text-sm font-semibold text-white hover:bg-[#6f0d24] disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={summary.isFetching || entries.isFetching}
            aria-label="Refresh"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#E4D6C7] text-[#5b5047] hover:bg-[#FBF6EF] disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            {summary.isFetching || entries.isFetching ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={15} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* The open ledger page */}
      <div className="rounded-[26px] border border-[#E4D6C7] bg-[#FBF6EF] p-4 sm:p-7 dark:border-white/10 dark:bg-white/[0.02]">
        <ol className={`space-y-1 border-l-2 border-[#87102C]/40 pl-4 text-sm leading-relaxed ${SUBINK} list-decimal marker:text-[#87102C]/50`}>
          <li>After each Sunday or Wednesday service, count and record its tithe &amp; offering under Record the service below.</li>
          <li>
            For anything else — Building fund, Rent, Giving, a Special Offering, or an expense — use <span className={`font-semibold ${INK}`}>Add entry</span>, any day it happens.
          </li>
        </ol>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#E4D6C7] pb-3 dark:border-white/10">
          <div className="flex items-center gap-5">
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`-mb-[13px] border-b-2 pb-3 text-[15px] font-medium transition-colors ${
                  period === p
                    ? "border-[#87102C] text-[#87102C] dark:border-[#FFB3C1] dark:text-[#FFB3C1]"
                    : `border-transparent ${SUBINK} hover:text-[#2B2420] dark:hover:text-white`
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {period === "daily" ? (
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="min-h-10 rounded-xl border border-[#E4D6C7] bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            ) : period === "weekly" ? (
              <input
                type="date"
                value={weeklyDate}
                onChange={(e) => setWeeklyDate(e.target.value)}
                className="min-h-10 rounded-xl border border-[#E4D6C7] bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                  className="min-h-10 rounded-xl border border-[#E4D6C7] bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {MONTH_LABELS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(Number(e.target.value))}
                  className="min-h-10 w-24 rounded-xl border border-[#E4D6C7] bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            )}
          </div>
        </div>

        {periodLabel && (
          <p className={`mt-3 text-sm ${SUBINK}`}>
            {period === "weekly" ? "Week of " : ""}
            {periodLabel}
          </p>
        )}

        {summary.isLoading ? (
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 w-28 animate-pulse rounded-lg bg-[#E4D6C7]/40 dark:bg-white/5" />
            ))}
          </div>
        ) : summary.isError ? (
          <div role="alert" className={`mt-6 rounded-2xl border border-red-200 p-5 text-sm ${INK} dark:border-red-900`}>
            Finance data could not load.{" "}
            <button type="button" onClick={() => summary.refetch()} className="min-h-11 font-semibold underline">
              Try again
            </button>
          </div>
        ) : (
          data && (
            <>
              {/* Totals strip */}
              <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-4 divide-x divide-[#E4D6C7] dark:divide-white/10">
                {ledgerStats.map((s, i) => (
                  <div key={s.label} className={i > 0 ? "pl-8" : ""}>
                    <p className={`text-xs ${SUBINK}`}>{s.label}</p>
                    <p className={`font-serif text-2xl font-semibold tabular-nums ${INK}`}>{formatNaira(s.value)}</p>
                  </div>
                ))}
                <div className="pl-8">
                  <p className={`text-xs ${SUBINK}`}>Net</p>
                  <p className="inline-flex items-baseline gap-1 rounded-full border border-[#B9862E]/50 bg-[#B9862E]/10 px-3 py-1 font-serif text-2xl font-semibold tabular-nums text-[#8A6420] dark:text-amber-300">
                    {formatNaira(data.netTotal)}
                  </p>
                </div>
              </div>

              {period !== "monthly" && (
                <section className="mt-8">
                  <h2 className={`text-[15px] font-semibold ${INK}`}>Record the service</h2>
                  {data.services.length === 0 ? (
                    <p className={`mt-3 text-sm ${SUBINK}`}>No service in this period.</p>
                  ) : (
                    <div className="mt-2">
                      {data.services.map((s) => (
                        <ServiceOfferingRow key={s.id} service={s} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {period === "monthly" ? (
                <section className="mt-9">
                  <h2 className={`text-[15px] font-semibold ${INK}`}>Other income &amp; expenses</h2>
                  <p className={`mt-0.5 text-xs ${SUBINK}`}>Everything beyond tithe &amp; offering, by category — Building, Rent, Giving, utilities, and the rest.</p>
                  <div className="mt-4 grid gap-8 sm:grid-cols-2">
                    <CategoryLedger title="Income" icon={ArrowDownLeft} tone={CREDIT} categories={data.incomeByCategory} />
                    <CategoryLedger title="Expenses" icon={ArrowUpRight} tone={DEBIT} categories={data.expenseByCategory} />
                  </div>
                </section>
              ) : (
                <section className="mt-9">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className={`text-[15px] font-semibold ${INK}`}>Other income &amp; expenses</h2>
                      <p className={`mt-0.5 text-xs ${SUBINK}`}>Everything beyond tithe &amp; offering — Building, Rent, Giving, utilities, and the rest.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntryModal({ open: true, entry: null, defaultKind: "INCOME" })}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#87102C] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#6E0C24]"
                    >
                      <Plus size={13} /> Add entry
                    </button>
                  </div>

                  {entries.isLoading ? (
                    <div className="mt-4 space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded-lg bg-[#E4D6C7]/30 dark:bg-white/5" />
                      ))}
                    </div>
                  ) : incomeGroups.length === 0 && expenseGroups.length === 0 ? (
                    <div className={`mt-4 rounded-xl border border-dashed ${RULE} px-4 py-6 text-center text-sm ${SUBINK}`}>
                      No income or expenses recorded for this period yet — use <span className={`font-semibold ${INK}`}>Add entry</span> above.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-8 lg:grid-cols-2">
                      <EntryGroupList
                        title="Income"
                        icon={ArrowDownLeft}
                        tone={CREDIT}
                        sign="+"
                        groups={incomeGroups}
                        onEdit={(e) => setEntryModal({ open: true, entry: e, defaultKind: e.kind })}
                        onDelete={setRemoving}
                      />
                      <EntryGroupList
                        title="Expenses"
                        icon={ArrowUpRight}
                        tone={DEBIT}
                        sign="–"
                        groups={expenseGroups}
                        onEdit={(e) => setEntryModal({ open: true, entry: e, defaultKind: e.kind })}
                        onDelete={setRemoving}
                      />
                    </div>
                  )}
                </section>
              )}
            </>
          )
        )}
      </div>

      <FinanceEntryModal
        key={entryModal.entry?.id ?? `new-${entryModal.defaultKind}`}
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

function ColumnHeading({ title, icon: Icon, tone }: { title: string; icon: typeof ArrowDownLeft; tone: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#E4D6C7] pb-2 dark:border-white/10">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-current/10 ${tone}`}>
        <Icon size={13} className={tone} aria-hidden="true" />
      </span>
      <span className={`text-sm font-semibold ${INK}`}>{title}</span>
    </div>
  );
}

/** A plain category → total breakdown, used for Monthly (where entries aren't itemized). */
function CategoryLedger({
  title,
  icon,
  tone,
  categories,
}: {
  title: string;
  icon: typeof ArrowDownLeft;
  tone: string;
  categories: { category: string; amount: number }[];
}) {
  return (
    <div>
      <ColumnHeading title={title} icon={icon} tone={tone} />
      {categories.length === 0 ? (
        <p className={`mt-3 text-sm ${SUBINK}`}>None recorded.</p>
      ) : (
        <ul className="mt-1 divide-y divide-[#E4D6C7] dark:divide-white/10">
          {categories.map((c) => (
            <li key={c.category} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span className={INK}>{c.category}</span>
              <span className={`rounded-full bg-current/10 px-2.5 py-0.5 font-semibold tabular-nums ${tone}`}>
                {formatNaira(c.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EntryGroupList({
  title,
  icon,
  tone,
  sign,
  groups,
  onEdit,
  onDelete,
}: {
  title: string;
  icon: typeof ArrowDownLeft;
  tone: string;
  sign: "+" | "–";
  groups: { category: string; total: number; items: FinanceEntry[] }[];
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
}) {
  return (
    <div>
      <ColumnHeading title={title} icon={icon} tone={tone} />
      {groups.length === 0 ? (
        <p className={`mt-3 text-sm ${SUBINK}`}>None recorded yet.</p>
      ) : (
        <div className="mt-3 space-y-5">
          {groups.map((g) => (
            <div key={g.category}>
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-sm font-semibold ${INK}`}>{g.category}</span>
                <span className={`rounded-full bg-current/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums ${tone}`}>
                  {sign}{formatNaira(g.total)}
                </span>
              </div>
              <ul className="mt-1 divide-y divide-[#E4D6C7] dark:divide-white/10">
                {g.items.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className={`flex items-center gap-1.5 truncate text-sm ${INK}`}>
                        {e.label || "—"}
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
                      </p>
                      <p className={`text-xs ${SUBINK}`}>{shortDate(e.date)}{e.note ? ` · ${e.note}` : ""}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-medium tabular-nums ${tone}`}>
                      {sign}{formatNaira(e.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEdit(e)}
                      aria-label={`Edit ${e.category} entry`}
                      className="shrink-0 rounded-lg p-1.5 text-[#C9BBAC] hover:bg-[#FBF6EF] hover:text-[#5b5047] dark:hover:bg-white/5"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(e)}
                      aria-label={`Delete ${e.category} entry`}
                      className="shrink-0 rounded-lg p-1.5 text-[#C9BBAC] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
