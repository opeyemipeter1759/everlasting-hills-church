/** Where the Membership and Assimilation unit pages live. */
export const MEMBERSHIP_ASSIMILATION_BASE = "/dashboard/membership-assimilation";

/**
 * Whether a department is Membership and Assimilation — the department whose
 * units each get their own sidebar item and page.
 *
 * Department names are typed by admins, so this matches on the two words
 * rather than an exact string: "Membership and Assimilation", "Membership &
 * Assimilation" and "membership/assimilation" all count.
 */
export function isMembershipAssimilationDepartment(name: unknown): boolean {
  if (typeof name !== "string") return false;
  const letters = name.toLowerCase().replace(/[^a-z]/g, "");
  return letters.includes("membership") && letters.includes("assimilation");
}
