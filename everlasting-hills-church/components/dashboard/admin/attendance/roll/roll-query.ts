import type { AttendanceListQuery, OverviewService } from "@/lib/api/attendance-roll";
import type { SelectOption } from "@/components/ui/select";

export type RollStatus = "PRESENT" | "ABSENT" | undefined;
export type RollGender = "male" | "female" | undefined;
export type RollSortCol = "name" | "date" | "markedBy" | "status";

/** Scopes wider than one service. Anything else in `scope` is a service id. */
export const BROAD_SCOPES: Record<string, { label: string; serviceKey?: string }> = {
  all: { label: "Every service" },
  sunday: { label: "Every Sunday", serviceKey: "sunday" },
  wednesday: { label: "Every midweek service", serviceKey: "wednesday" },
};

export function isOneService(scope: string): boolean {
  return !(scope in BROAD_SCOPES);
}

export interface RollState {
  scope: string;
  status: RollStatus;
  gender: RollGender;
  name: string;
  sort: { col: RollSortCol; dir: "asc" | "desc" } | null;
  page: number;
  limit: number;
}

const SORT_BY: Record<RollSortCol, string> = { name: "name", date: "date", markedBy: "markedAt", status: "status" };

/**
 * The GET /attendance query for what the filters show. With no sort picked,
 * one service reads as an alphabetical roll and a wider scope newest first.
 */
export function rollQuery(st: RollState): AttendanceListQuery {
  const one = isOneService(st.scope);
  const sort = st.sort ?? (one ? { col: "name" as const, dir: "asc" as const } : { col: "date" as const, dir: "desc" as const });
  const serviceKey = one ? undefined : BROAD_SCOPES[st.scope].serviceKey;
  return {
    page: st.page,
    limit: st.limit,
    ...(one ? { serviceId: st.scope } : {}),
    ...(serviceKey ? { serviceKey } : {}),
    ...(st.status ? { status: st.status } : {}),
    ...(st.gender ? { gender: st.gender } : {}),
    ...(st.name.trim() ? { name: st.name.trim() } : {}),
    sortBy: SORT_BY[sort.col],
    sortOrder: sort.dir === "asc" ? "ASC" : "DESC",
  };
}

const SHORT_KIND: Record<OverviewService["serviceType"], string> = { SUNDAY: "Sunday", WEDNESDAY: "Midweek", SPECIAL: "Special" };

function dayMonth(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** The service picker: recent services one by one, then the wider scopes. */
export function scopeOptions(services: OverviewService[]): SelectOption[] {
  return [
    ...services.map((s) => ({
      value: s.id,
      label: `${SHORT_KIND[s.serviceType]}, ${dayMonth(s.date)}`,
      group: "Recent services",
      hint: `${s.checkedIn} in`,
    })),
    ...Object.entries(BROAD_SCOPES).map(([value, { label }]) => ({ value, label, group: "All the services" })),
  ];
}
