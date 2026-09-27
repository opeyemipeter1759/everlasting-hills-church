/** Where the Growth & Outreach unit pages live. */
export const GROWTH_OUTREACH_BASE = "/dashboard/growth-outreach";

/**
 * Whether a department is Growth & Outreach — like Membership and
 * Assimilation, its units each get their own sidebar item and page.
 * Matches on the two words: "Growth & Outreach", "Growth and Outreach" and
 * "growth/outreach" all count.
 */
export function isGrowthOutreachDepartment(name: unknown): boolean {
  if (typeof name !== "string") return false;
  const letters = name.toLowerCase().replace(/[^a-z]/g, "");
  return letters.includes("growth") && letters.includes("outreach");
}

/** "Evangelism Team", "Evangelism Unit", "EVANGELISM" all count. */
export function isEvangelismUnit(name: string | undefined | null): boolean {
  return typeof name === "string" && name.toLowerCase().replace(/[^a-z]/g, "").includes("evangelis");
}
