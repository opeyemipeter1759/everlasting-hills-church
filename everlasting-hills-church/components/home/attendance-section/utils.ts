import type { FrontendSessionUser } from "@/lib/auth/frontend-session";

export function firstNameOf(s: FrontendSessionUser): string {
  return s.fullName?.split(" ")[0] ?? s.email?.split("@")[0] ?? "friend";
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Last week";
  return `${weeks} weeks ago`;
}

export function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

export type DateBucket = "Upcoming" | "Today" | "This Week" | "Past";

/** Upcoming = scheduled for later (createdAt in the future); Today = posted
 *  today; This Week = within the last 7 days; Past = older. Based on real
 *  createdAt vs now. */
export function dateBucketOf(iso: string): DateBucket {
  const created = new Date(iso);
  const now = new Date();
  if (created.getTime() > now.getTime()) return "Upcoming";
  const isSameDay =
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate();
  if (isSameDay) return "Today";
  const days = Math.floor((now.getTime() - created.getTime()) / 86_400_000);
  return days < 7 ? "This Week" : "Past";
}
