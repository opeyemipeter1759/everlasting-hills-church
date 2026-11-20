/**
 * Couple dashboard accounts (pre-marital counselling, for partners who are not
 * members) have no church role. Supabase marks them in app_metadata, which
 * only the server can set, so routing may trust it. Access itself is decided
 * by the API, which refuses these accounts everywhere but the dashboard.
 */
export const COUPLE_HOME = "/couple-dashboard";
const ROLELESS_HOME = "/dashboard/profile";

export function isCoupleAccount(appMetadata: { [key: string]: unknown } | null | undefined): boolean {
  return appMetadata?.account === "counselling_couple";
}

/** Where a signed-in person with no church role belongs. */
export function rolelessHome(claims: { app_metadata?: { [key: string]: unknown } } | null | undefined): string {
  return isCoupleAccount(claims?.app_metadata) ? COUPLE_HOME : ROLELESS_HOME;
}
