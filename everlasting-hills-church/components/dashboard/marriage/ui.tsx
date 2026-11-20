"use client";

import type { ReactNode } from "react";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useMarriageAction } from "@/lib/api/premarital";
import { STATUS_LABEL, type CaseStatus } from "@/lib/pre-marital/schema";

export const card = "rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#161618] sm:p-5";
export const input =
  "min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-[#111] placeholder:text-gray-400 dark:border-white/15 dark:bg-white/5 dark:text-white sm:text-sm";
export const selectBox = `${input} text-left`;
export const button =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] disabled:cursor-not-allowed disabled:opacity-60";
export const primary = `${button} bg-[#87102C] text-white hover:bg-[#6E0C24]`;
export const secondary = `${button} border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white/85 dark:hover:bg-white/10`;

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-[#87102C] dark:text-[#f3a9b8]">Marriage</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111] dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-white/60">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

const TONE: Record<CaseStatus, string> = {
  SUBMITTED: "bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  ADDITIONAL_INFORMATION_REQUIRED: "bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200",
  ACCEPTED_FOR_COUNSELLING: "bg-violet-50 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200",
  IN_COUNSELLING: "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#f3a9b8]",
  FINAL_REVIEW: "bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  CLOSED: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export const coupleName = (c: { applicantFirstName: string; applicantLastName: string; partnerFirstName: string; partnerLastName: string }) =>
  `${c.applicantFirstName} ${c.applicantLastName} & ${c.partnerFirstName} ${c.partnerLastName}`;

const tz = { timeZone: "Africa/Lagos" } as const;
export const lagosDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...tz });
export const lagosDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, ...tz });
/** The Lagos calendar day of an instant, YYYY-MM-DD. */
export const lagosDay = (iso: string) => new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 10);

/** Loading, "not for you" (the API answers 404 for anything a person may not see) and other errors. */
export function QueryState({ isLoading, error }: { isLoading: boolean; error: unknown }) {
  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-gray-100 motion-reduce:animate-none dark:bg-white/5" aria-label="Loading" />;
  if (!error) return null;
  const status = (error as ApiError).status;
  return (
    <p className={`${card} text-sm text-gray-700 dark:text-white/75`}>
      {status === 404 ? "There is nothing here for you. If you think there should be, ask a pastor." : "This could not be loaded. Check your connection and try again."}
    </p>
  );
}

/** Runs a change, says how it went, and refreshes the Marriage pages. */
export function useRun() {
  const action = useMarriageAction();
  async function run(method: "post" | "patch" | "put" | "delete", path: string, body: object | undefined, done: string) {
    try {
      await action.mutateAsync({ method, path, body });
      showToast.success(done);
      return true;
    } catch (err) {
      showToast.error((err as ApiError).message || "That did not go through. Try again.");
      return false;
    }
  }
  return { run, pending: action.isPending };
}
