import { statusLabel, type ApplicationStatus } from "@/lib/pre-marital/schema";

const TONE: Record<ApplicationStatus, string> = {
  NEW: "bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  IN_REVIEW: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  CLOSED: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[status]}`}>{statusLabel(status)}</span>;
}

export const coupleName = (a: { groomFirstName: string; groomLastName: string; brideFirstName: string; brideLastName: string }) =>
  `${a.groomFirstName} ${a.groomLastName} & ${a.brideFirstName} ${a.brideLastName}`;

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
