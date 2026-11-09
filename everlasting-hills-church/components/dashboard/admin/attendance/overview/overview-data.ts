import type { OverviewService, ServiceHeadcountSummary } from "@/lib/api/attendance-roll";

/** The three groups ushers count. Colours are validated for colour-blind separation in both themes. */
export const GROUPS = [
  { key: "men", label: "Men", swatch: "bg-[#B8324F] dark:bg-[#D44F6C]" },
  { key: "women", label: "Women", swatch: "bg-[#D98E1F] dark:bg-[#C4861C]" },
  { key: "children", label: "Children", swatch: "bg-[#2a78d6] dark:bg-[#4A90E2]" },
] as const satisfies readonly { key: keyof ServiceHeadcountSummary; label: string; swatch: string }[];

export const KIND_LABEL: Record<OverviewService["serviceType"], string> = {
  SUNDAY: "Sunday service",
  WEDNESDAY: "Midweek service",
  SPECIAL: "Special service",
};

export const KIND_PLURAL: Record<OverviewService["serviceType"], string> = {
  SUNDAY: "Recent Sundays",
  WEDNESDAY: "Recent midweek services",
  SPECIAL: "Recent special services",
};

/** The service the overview opens on: the newest one with anything to show yet. */
export function defaultService(services: OverviewService[]): OverviewService | undefined {
  return services.find((s) => s.headcount || s.checkedIn > 0) ?? services[0];
}

/** The last service of the same kind the ushers counted before this one, to compare against. */
export function previousCounted(services: OverviewService[], id: string): OverviewService | undefined {
  const i = services.findIndex((s) => s.id === id);
  if (i < 0) return undefined;
  const kind = services[i].serviceType;
  return services.slice(i + 1).find((s) => s.serviceType === kind && s.headcount);
}

/** Services of one kind, oldest first, for the strip under the figures. */
export function sameKind(services: OverviewService[], kind: OverviewService["serviceType"], max = 12): OverviewService[] {
  return services.filter((s) => s.serviceType === kind).slice(0, max).reverse();
}

export function share(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** "+5", "−3" or "no change", against the previous service. */
export function change(now: number, before: number): string {
  const d = now - before;
  if (d === 0) return "no change";
  return d > 0 ? `+${d}` : `−${Math.abs(d)}`;
}

/** "16 more than on 1 Nov", "4 fewer than on 1 Nov", "The same as on 1 Nov". */
export function comparedWith(now: number, before: number, beforeDate: string): string {
  const d = now - before;
  const on = `on ${dayMonth(beforeDate)}`;
  if (d === 0) return `The same as ${on}`;
  return `${Math.abs(d)} ${d > 0 ? "more" : "fewer"} than ${on}`;
}

function utc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "8 Nov" */
export function dayMonth(date: string): string {
  return utc(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** "Sunday, 8 November 2026" */
export function longDate(date: string): string {
  return utc(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Today in Lagos (UTC+1), YYYY-MM-DD. */
export function lagosToday(now = Date.now()): string {
  return new Date(now + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Who was expected on the roll. Once a service closes its absentees are
 * written, so present + absent is the roll as it stood that day; before then
 * it is everyone active now.
 */
export function rollSize(s: OverviewService, activeMembers: number): number {
  return s.absent > 0 ? s.checkedIn + s.absent : Math.max(activeMembers, s.checkedIn);
}
