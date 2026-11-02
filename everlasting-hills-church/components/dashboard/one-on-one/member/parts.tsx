"use client";

import type { MeetingFormat, MyRequest, RequestStatus } from "@/lib/api/one-on-one";

const PORTRAITS = [
  "bg-[radial-gradient(circle_at_30%_25%,#B8314F,#87102C_55%,#4A0819)]",
  "bg-[radial-gradient(circle_at_30%_25%,#D7A94B,#A67C26_55%,#5E4211)]",
];

export function initials(name: string): string {
  return name
    .replace(/^Pastor\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Portrait({ name, index, size = "md" }: { name: string; index: number; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-full font-serif text-white ${dims} ${PORTRAITS[index % PORTRAITS.length]}`}
    >
      {initials(name)}
    </span>
  );
}

export const FORMAT_LABEL: Record<MeetingFormat, string> = {
  IN_PERSON: "In person, church office",
  GOOGLE_MEET: "Google Meet",
  PHONE: "Phone call",
};

const LAGOS = "Africa/Lagos";

export function formatWhenLong(startIso: string, endIso: string): string {
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS, weekday: "long", day: "numeric", month: "long" }).format(new Date(startIso));
  const t = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  return `${day}, ${t(startIso)}–${t(endIso)}`;
}

export function pastorsOf(r: { hostName: string; coHostName: string | null }): string {
  return r.coHostName ? `${r.hostName} and ${r.coHostName}` : r.hostName;
}

export const STATUS_PILL: Record<RequestStatus, { label: (r: MyRequest) => string; className: string }> = {
  HOLD: { label: () => "Confirm your email", className: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" },
  PENDING: { label: (r) => `Waiting for ${r.hostName}`, className: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" },
  PROPOSED: { label: () => "A different time suggested", className: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" },
  APPROVED: { label: () => "Approved", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" },
  DECLINED: { label: () => "Not approved", className: "bg-[#F3ECEE] text-[#7A6A6F] dark:bg-white/[0.06] dark:text-white/55" },
  CANCELLED: {
    label: (r) => (r.cancelledBy === "HOST" ? "Cancelled by the pastor" : "Cancelled by you"),
    className: "bg-[#F3ECEE] text-[#7A6A6F] dark:bg-white/[0.06] dark:text-white/55",
  },
  LAPSED: { label: () => "No response in time", className: "bg-[#F3ECEE] text-[#7A6A6F] dark:bg-white/[0.06] dark:text-white/55" },
  COMPLETED: { label: () => "Completed", className: "bg-[#F3ECEE] text-[#7A6A6F] dark:bg-white/[0.06] dark:text-white/55" },
};

export function StatusPill({ request }: { request: MyRequest }) {
  const s = STATUS_PILL[request.status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${s.className}`}>{s.label(request)}</span>;
}

/** Still in play for the member: something they're waiting on, or a session still ahead. */
export function isOpen(r: MyRequest, now = Date.now()): boolean {
  return (r.status === "PENDING" || r.status === "PROPOSED" || r.status === "APPROVED") && new Date(r.endsAt).getTime() > now;
}
