import type { MembersAtRisk } from "@/lib/api/members-at-risk";

export type RiskReason = "in-a-row" | "never" | "low-rate";

export interface RiskRow {
  userId: string;
  userName: string;
  photoUrl: string | null;
  phone: string | null;
  reason: RiskReason;
  /** One plain sentence on why they're listed. */
  detail: string;
  lastSeen: string | null;
  /** Sundays attended out of those they could have, in the last eight; null when they never checked in. */
  attended: number | null;
  eligible: number;
}

export const REASONS: Record<RiskReason, { label: string; badge: string }> = {
  "in-a-row": { label: "Missed in a row", badge: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  never: { label: "Never checked in", badge: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300" },
  "low-rate": { label: "Under half", badge: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" },
};

function utc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "9 Sep" */
export function shortDate(date: string): string {
  return utc(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** "this week", "1 week ago", "9 weeks ago" — from a YYYY-MM-DD date. */
export function weeksAgo(date: string, now = Date.now()): string {
  const weeks = Math.floor((now - utc(date).getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (weeks <= 0) return "this week";
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

const sundays = (n: number) => (n === 1 ? "Sunday" : "Sundays");

/** One row per person, most serious first: missed in a row, never checked in, then under half. */
export function toRiskRows(data: MembersAtRisk | undefined): RiskRow[] {
  if (!data) return [];
  return [
    ...data.absentConsecutiveWeeks.map((m) => ({
      ...m,
      reason: "in-a-row" as const,
      detail: `Missed the last ${m.consecutiveAbsences} ${sundays(m.consecutiveAbsences)}`,
      attended: m.presentCount,
      eligible: m.totalCount,
    })),
    ...data.neverAttended.map((m) => ({
      ...m,
      reason: "never" as const,
      detail: `Joined ${shortDate(m.joinedAt)}, ${m.sundaysSinceJoining} ${sundays(m.sundaysSinceJoining)} ago`,
      attended: null,
      eligible: Math.min(m.sundaysSinceJoining, data.window.sundays),
    })),
    ...data.belowFiftyPercent.map((m) => ({
      ...m,
      reason: "low-rate" as const,
      detail: `Came to ${m.presentCount} of the last ${m.totalCount} ${sundays(m.totalCount)}`,
      attended: m.presentCount,
      eligible: m.totalCount,
    })),
  ].map(({ userId, userName, photoUrl, phone, reason, detail, lastSeen, attended, eligible }) => ({
    userId, userName, photoUrl, phone, reason, detail, lastSeen, attended, eligible,
  }));
}

export function filterRiskRows(rows: RiskRow[], reason: RiskReason | null, search: string): RiskRow[] {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter((r) => (!reason || r.reason === reason) && words.every((w) => r.userName.toLowerCase().includes(w)));
}

export function countByReason(rows: RiskRow[]): Record<RiskReason, number> {
  const counts: Record<RiskReason, number> = { "in-a-row": 0, never: 0, "low-rate": 0 };
  for (const r of rows) counts[r.reason]++;
  return counts;
}
