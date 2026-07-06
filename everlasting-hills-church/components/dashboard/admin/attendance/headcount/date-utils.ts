import type { ServiceTypeKey } from "@/lib/api/headcount";

export const TYPE_LABEL: Record<ServiceTypeKey, string> = {
  SUNDAY: "Sunday",
  WEDNESDAY: "Wednesday",
  SPECIAL: "Special",
};

const WAT_MS = 60 * 60 * 1000;

/** Today's date in WAT as YYYY-MM-DD. */
export function watTodayStr() {
  return new Date(Date.now() + WAT_MS).toISOString().slice(0, 10);
}

/** Most recent occurrence of a weekday (0=Sun, 3=Wed), today included, as YYYY-MM-DD. */
export function lastWeekdayStr(target: number) {
  const wat = new Date(Date.now() + WAT_MS);
  const diff = (wat.getUTCDay() - target + 7) % 7;
  return new Date(wat.getTime() - diff * 86_400_000).toISOString().slice(0, 10);
}

/** Pretty label for a YYYY-MM-DD date, e.g. "Sun, 5 Jul 2026". */
export function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Infer the service type from a YYYY-MM-DD date's weekday. */
export function inferType(iso: string): ServiceTypeKey {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? "SUNDAY" : wd === 3 ? "WEDNESDAY" : "SPECIAL";
}
