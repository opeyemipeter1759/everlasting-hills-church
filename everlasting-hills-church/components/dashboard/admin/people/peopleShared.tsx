"use client";

import type { PersonRole, PersonRow } from "@/lib/api/people";

// ── Role metadata ────────────────────────────────────────────────────────────

export const ROLE_LABEL: Record<PersonRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin",
  ADMIN_HEAD: "Admin Head",
  HEAD_USHER: "Head Usher",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
  VISITOR: "Visitor",
};

/** Brand-aligned role badge. Burgundy for leadership, muted for members. */
export const ROLE_BADGE: Record<PersonRole, string> = {
  SUPER_ADMIN:
    "bg-[#87102C] text-white border-transparent",
  PASTOR:
    "bg-[#FFE8ED] text-[#87102C] border-[#E7CDD3] dark:bg-[#87102C]/25 dark:text-[#e8768a] dark:border-[#87102C]/40",
  ADMIN:
    "bg-[#FFF4F6] text-[#87102C] border-[#E7CDD3] dark:bg-[#87102C]/15 dark:text-[#e8768a] dark:border-white/10",
  ADMIN_HEAD:
    "bg-[#FFF4F6] text-[#9b3050] border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10",
  HEAD_USHER:
    "bg-[#FFF4F6] text-[#9b3050] border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10",
  UNIT_LEAD:
    "bg-[#FFF4F6] text-[#9b3050] border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10",
  MEMBER:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
  VISITOR:
    "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
};

export const STATUS_BADGE: Record<string, string> = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  INACTIVE: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
  TRANSFERRED:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  DECEASED: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
};

export const STATUS_OPTIONS = [
  "ACTIVE",
  "INACTIVE",
  "TRANSFERRED",
  "DECEASED",
] as const;

// ── Formatting helpers ───────────────────────────────────────────────────────

export function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

/**
 * Stable, human-readable member ID derived from the record's UUID — same id
 * always yields the same code, no schema change required. e.g. "EHC-A1B2C3D4".
 */
export function displayId(id: string): string {
  const hex = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `EHC-${hex}`;
}

export function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtBirthday(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function genderLabel(g: string | null) {
  if (!g) return "—";
  const u = g.toUpperCase();
  return u === "MALE" ? "Male" : u === "FEMALE" ? "Female" : "—";
}

/**
 * Profile completion % — derived client-side from the fields that make a member
 * record "complete" for pastoral care. No backend storage needed.
 */
export function profileCompletion(p: PersonRow): number {
  const checks = [
    Boolean(p.photoUrl),
    Boolean(p.email),
    Boolean(p.phone),
    Boolean(p.gender),
    Boolean(p.dateOfBirth),
    Boolean(p.address),
    p.units.length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

// ── Presentational atoms ─────────────────────────────────────────────────────

export function Avatar({
  photoUrl,
  firstName,
  lastName,
  size = 40,
}: {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  size?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/25 flex items-center justify-center text-xs font-bold text-[#87102C] dark:text-[#e8768a] flex-shrink-0"
    >
      {initials(firstName, lastName)}
    </span>
  );
}

export function ProfileCompletionMeter({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-emerald-500"
      : value >= 50
        ? "bg-[#87102C]"
        : "bg-amber-500";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${tone} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-gray-500 dark:text-white/50 w-8 text-right">
        {value}%
      </span>
    </div>
  );
}
