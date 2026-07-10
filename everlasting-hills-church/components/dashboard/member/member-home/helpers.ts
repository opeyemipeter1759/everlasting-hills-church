import { muted } from "./tokens";
import { DAILY_SCRIPTURES } from "./content";
import type { MemberHomeProps } from "./types";

export function getProfileCompletion(member: MemberHomeProps["member"]): {
  pct: number;
  complete: boolean;
} {
  const fields = [member?.bio, member?.phone, member?.dateOfBirth, member?.address, member?.photoUrl];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  return { pct, complete: pct >= 60 };
}

export function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function getDailyScripture() {
  const idx = getDayIndex();
  return DAILY_SCRIPTURES[idx % DAILY_SCRIPTURES.length];
}

export function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Last week";
  return `${weeks} weeks ago`;
}

export function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function standingLabel(rate: number): { text: string; color: string } {
  if (rate >= 90) return { text: "Excellent Standing", color: "text-emerald-600 dark:text-emerald-400" };
  if (rate >= 70) return { text: "Good Standing", color: "text-sky-600 dark:text-sky-400" };
  if (rate >= 50) return { text: "Fair Standing", color: "text-amber-600 dark:text-amber-400" };
  if (rate > 0) return { text: "Needs Improvement", color: "text-red-500 dark:text-red-400" };
  return { text: "No records yet", color: `${muted}` };
}

export function streakLabel(weeks: number): { text: string; dot: string } {
  if (weeks >= 8) return { text: "Consistent level", dot: "bg-purple-500" };
  if (weeks >= 4) return { text: "Firm level", dot: "bg-emerald-500" };
  if (weeks >= 2) return { text: "Building level", dot: "bg-sky-500" };
  if (weeks === 1) return { text: "Starting level", dot: "bg-amber-500" };
  return { text: "No streak yet", dot: "bg-gray-300 dark:bg-white/20" };
}

export function getServiceCountdown(scheduledAt: string): string {
  const ms = new Date(scheduledAt).getTime() - Date.now();
  if (ms <= 0) return "Now";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}
