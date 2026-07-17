import type { PersonRow } from "@/lib/api/people";

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
