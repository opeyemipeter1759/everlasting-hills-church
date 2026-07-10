export function initialsOf(first: string | null, last: string | null): string {
  return `${(first ?? "?")[0] ?? ""}${(last ?? "")[0] ?? ""}`.toUpperCase();
}

export function fmtJoined(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function tenureFrom(iso: string | null): string {
  if (!iso) return "New member";
  const months = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
  );
  if (months < 1) return "Just joined";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y} year${y === 1 ? "" : "s"}` : `${y}y ${m}mo`;
}

export function fmtDayMonth(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

/** weddingAnniversary doubles as the "are they married" signal — there's no separate boolean field. */
export function maritalStatus(weddingAnniversary: string | null): "Married" | "Single" {
  return weddingAnniversary ? "Married" : "Single";
}

export function computeAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age >= 0 ? age : null;
}

export function computeAgeGroup(dateOfBirth: string | null): "teen" | "adult" | null {
  const age = computeAge(dateOfBirth);
  if (age === null) return null;
  if (age >= 13 && age <= 19) return "teen";
  if (age >= 20) return "adult";
  return null;
}
