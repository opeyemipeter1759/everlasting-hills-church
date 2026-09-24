/**
 * Which unit a page belongs to, by name.
 *
 * Unit names are typed by admins, so these match on the word rather than an
 * exact string: "Follow-Up", "Follow up team" and "FOLLOWUP" all count, as do
 * "Integration", "Integration Team" and "integration/assimilation".
 */
function letters(name: string | undefined | null): string {
  return typeof name === "string" ? name.toLowerCase().replace(/[^a-z]/g, "") : "";
}

export function isFollowUpUnit(name: string | undefined | null): boolean {
  return letters(name).includes("followup");
}

export function isIntegrationUnit(name: string | undefined | null): boolean {
  return letters(name).includes("integration");
}
