/**
 * Couple dashboard accounts (pre-marital counselling) are Supabase sign-ins
 * with no Profile. They carry this marker in app_metadata, which only the
 * service role can write, so the website can route them to their dashboard.
 * The API never trusts the marker for access: it fences off every sign-in
 * without a Profile (RolesGuard) and finds the application by auth user id.
 */
export const COUPLE_ACCOUNT_MARKER = 'counselling_couple';

export function isCoupleAccount(appMetadata: unknown): boolean {
  return (
    !!appMetadata &&
    typeof appMetadata === 'object' &&
    (appMetadata as { account?: unknown }).account === COUPLE_ACCOUNT_MARKER
  );
}
