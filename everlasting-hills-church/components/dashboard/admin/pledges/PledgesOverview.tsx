"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, Download, HandCoins, Loader2, PhoneCall, RefreshCw, Search, Trash2, Users } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import { formatNaira, normalizePledge, pledgePlan, useDeletePledge, usePledges, type Pledge } from "@/lib/api/pledges";

/**
 * Pledges to the Sound & Media Project, for pastors, admins and the project
 * team: who pledged what, how they plan to give, by when, and who asked to be
 * called.
 */

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(date.length === 10 ? `${date}T12:00:00Z` : date),
  );

/** wa.me wants the international number without the plus. */
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
}

function csvCell(value: string | number | null) {
  let text = value == null ? "" : String(value);
  // A cell starting with = or @ is a formula to a spreadsheet.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function pledgesCsv(pledges: Pledge[]) {
  const header = [
    "Full name", "Phone (WhatsApp)", "Email", "Pledge (NGN)", "Given (NGN)", "Balance (NGN)",
    "Progress", "How", "Per installment (NGN)", "Installment history", "Complete by",
    "Contact about pledge", "Pledged on", "Last updated",
  ];
  const rows = pledges.map((rawPledge) => {
    const pledge = normalizePledge(rawPledge);
    return [
      pledge.fullName,
      pledge.phone,
      pledge.email,
      pledge.amount,
      pledge.amountGiven,
      pledge.balance,
      `${pledge.progressPercent}%`,
      pledgePlan({ ...pledge, installmentAmount: null }),
      pledge.installmentAmount,
      pledge.installments.map((item) => `${item.givenOn}: ${item.amount}${item.note ? ` (${item.note})` : ""}`).join("; "),
      pledge.completeBy,
      pledge.contactMe ? "Yes" : "No",
      pledge.createdAt.slice(0, 10),
      pledge.updatedAt.slice(0, 10),
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadCsv(pledges: Pledge[]) {
  const url = URL.createObjectURL(new Blob([pledgesCsv(pledges)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `sound-media-pledges-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function PledgesOverview() {
  const { data, isLoading, isError, isFetching, refetch } = usePledges();
  const deletePledge = useDeletePledge();
  const [search, setSearch] = useState("");
  const [contactOnly, setContactOnly] = useState(false);
  const [removing, setRemoving] = useState<Pledge | null>(null);

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deletePledge.mutateAsync(removing.id);
      showToast.success(`${removing.fullName}'s pledge was removed.`);
      setRemoving(null);
    } catch (error) {
      showToast.error(userMessageForError(error, "The pledge couldn't be removed. Please try again."));
    }
  }

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const phoneTerm = term.replace(/\D/g, "");
    return (data?.pledges ?? [])
      .filter((pledge) => !contactOnly || pledge.contactMe)
      .filter(
        (pledge) =>
          !term ||
          pledge.fullName.toLowerCase().includes(term) ||
          pledge.email.toLowerCase().includes(term) ||
          (phoneTerm.length > 0 && pledge.phone.replace(/\D/g, "").includes(phoneTerm)),
      );
  }, [data, search, contactOnly]);

  const totals = data?.totals;
  const tiles = totals
    ? [
        { label: "Total pledged", value: formatNaira(totals.amount), icon: HandCoins },
        { label: "Giving recorded", value: formatNaira(totals.amountGiven), icon: CircleDollarSign },
        { label: "Balance remaining", value: formatNaira(totals.balance), icon: HandCoins },
        { label: "Pledges", value: totals.pledges.toLocaleString("en-NG"), icon: Users },
        { label: "Asked to be contacted", value: totals.wantContact.toLocaleString("en-NG"), icon: PhoneCall },
      ]
    : [];

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Sound &amp; Media pledges</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">
            Every member and public pledge, including installment progress, remaining balances and people who asked to be contacted.
            Installments shown here are recorded by pledgers after giving and should be reconciled with church bank records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(rows)}
            disabled={!rows.length}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-3.5 text-sm font-semibold text-white hover:bg-[#6f0d24] disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            {isFetching ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
            Refresh
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
          Pledges could not load.{" "}
          <button type="button" onClick={() => refetch()} className="min-h-11 font-semibold underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {tiles.map(({ label, value, icon: Icon }, index) => (
              <div
                key={label}
                className={`min-w-0 rounded-2xl border p-4 ${
                  index === 0
                    ? "border-[#f2b84b]/60 bg-[#fff8e8] dark:border-[#f2b84b]/25 dark:bg-[#f2b84b]/10"
                    : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/65">
                  <Icon size={14} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
                  {label}
                </dt>
                <dd className="mt-1.5 break-words text-xl font-black tabular-nums text-[#111] dark:text-white sm:text-2xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/75">
              <input
                id="pledges-contact-only"
                type="checkbox"
                checked={contactOnly}
                onChange={(event) => setContactOnly(event.target.checked)}
                className="h-4 w-4 accent-[#87102C]"
              />
              Only people who asked to be contacted
            </label>
            <div className="relative sm:w-72">
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="pledges-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or phone"
                aria-label="Search pledges"
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
              {data?.pledges.length ? "No pledges match." : "No pledges yet. They appear here as members make them."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-white/50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Pledger</th>
                    <th scope="col" className="px-4 py-3">WhatsApp</th>
                    <th scope="col" className="px-4 py-3 text-right">Pledge</th>
                    <th scope="col" className="px-4 py-3">Progress</th>
                    <th scope="col" className="px-4 py-3">How</th>
                    <th scope="col" className="px-4 py-3">Complete by</th>
                    <th scope="col" className="px-4 py-3">Contact</th>
                    <th scope="col" className="px-4 py-3">Pledged</th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {rows.map((pledge) => (
                    <tr key={pledge.id} className="align-top text-gray-700 dark:text-white/80">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{pledge.fullName}</p>
                        <a href={`mailto:${pledge.email}`} className="text-xs text-gray-500 hover:underline dark:text-white/50">
                          {pledge.email}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a
                          href={`https://wa.me/${whatsappNumber(pledge.phone)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#87102C] hover:underline dark:text-rose-300"
                        >
                          {pledge.phone}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatNaira(pledge.amount)}
                      </td>
                      <td className="min-w-44 px-4 py-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatNaira(pledge.amountGiven)}</span>
                          <span className="text-gray-500 dark:text-white/50">{pledge.progressPercent}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pledge.progressPercent}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-white/50">{formatNaira(pledge.balance)} remaining</p>
                        {pledge.installments.length > 0 && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-[11px] font-semibold text-[#87102C] dark:text-rose-300">
                              {pledge.installments.length} {pledge.installments.length === 1 ? "entry" : "entries"}
                            </summary>
                            <ul className="mt-1 space-y-1 text-[11px] text-gray-600 dark:text-white/60">
                              {[...pledge.installments].reverse().map((installment) => (
                                <li key={installment.id}>
                                  {shortDate(installment.givenOn)} · {formatNaira(installment.amount)}
                                  {installment.note ? ` · ${installment.note}` : ""}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                      <td className="px-4 py-3">{pledgePlan(pledge)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{shortDate(pledge.completeBy)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            pledge.contactMe
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"
                          }`}
                        >
                          {pledge.contactMe ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-white/50">
                        {shortDate(pledge.createdAt)}
                        {pledge.updatedAt.slice(0, 10) !== pledge.createdAt.slice(0, 10) && (
                          <span className="block text-xs">updated {shortDate(pledge.updatedAt)}</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => setRemoving(pledge)}
                          aria-label={`Remove ${pledge.fullName}'s pledge`}
                          title="Remove this pledge"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this pledge?"
        description={
          removing ? (
            <>
              <strong>{removing.fullName}</strong>&apos;s pledge of {formatNaira(removing.amount)}
              {removing.installments.length > 0 && (
                <>
                  , and the {removing.installments.length}{" "}
                  {removing.installments.length === 1 ? "installment" : "installments"} recorded on it (
                  {formatNaira(removing.amountGiven)}),
                </>
              )}{" "}
              will be deleted. This cannot be undone, and no email is sent.
            </>
          ) : null
        }
        confirmLabel="Remove pledge"
        tone="danger"
        loading={deletePledge.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
