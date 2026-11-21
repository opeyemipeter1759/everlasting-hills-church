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

type TempMeta = { needs_password_change?: unknown; temp_password_expires_at?: unknown };

/** When an unused temporary password stops working. Missing (older accounts) means it does not expire. */
export function tempPasswordExpiry(meta: unknown): Date | null {
  const at = (meta as TempMeta | null | undefined)?.temp_password_expires_at;
  if (typeof at !== 'string') return null;
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whether this account is still on a temporary password that has run out. */
export function tempPasswordExpired(meta: unknown, now = new Date()): boolean {
  const expiry = tempPasswordExpiry(meta);
  return (meta as TempMeta | null | undefined)?.needs_password_change === true && expiry !== null && expiry.getTime() <= now.getTime();
}

export const TEMP_PASSWORD_EXPIRED =
  'Your temporary password has expired. Tap "Forgot password" below and we will email you a link to choose your own.';
