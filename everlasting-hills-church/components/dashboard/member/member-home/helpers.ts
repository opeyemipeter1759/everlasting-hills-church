import { muted } from "./tokens";
import { DAILY_SCRIPTURES } from "./content";
import type { MemberHomeProps } from "./types";

/** Same fields as CompletionCard on the /dashboard/profile page (photo, bio,
 * phone, address). dateOfBirth is deliberately excluded — it isn't self-editable
 * from Settings (it comes from the first-timer form or admin records), so
 * counting it here would make this toast disagree with the page it links to,
 * and could leave it stuck below 100% forever for members who can't fix it. */
export function getProfileCompletion(member: MemberHomeProps["member"]): {
  pct: number;
  complete: boolean;
} {
  const fields = [member?.photoUrl, member?.bio, member?.phone, member?.address];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  return { pct, complete: filled === fields.length };
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

// Brand-first: the common/good case stays inside the church's maroon/pink
// identity (matches every other ring, badge, and button on this page); amber
// and red are reserved for genuinely-worth-flagging standings, same as the
// app's other status usages elsewhere — not a full rainbow per tier.
export function standingLabel(rate: number): { text: string; color: string; bg: string; ring: string } {
  if (rate >= 70) return { text: rate >= 90 ? "Excellent standing" : "Good standing", color: "text-[#87102C] dark:text-[#e8768a]", bg: "bg-[#FFE8ED] dark:bg-[#87102C]/15", ring: "#87102C" };
  if (rate >= 50) return { text: "Fair standing", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", ring: "#f59e0b" };
  if (rate > 0) return { text: "Needs improvement", color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", ring: "#ef4444" };
  return { text: "No records yet", color: muted, bg: "bg-gray-50 dark:bg-white/5", ring: "#9ca3af" };
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
