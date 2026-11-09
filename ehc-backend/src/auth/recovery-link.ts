import { createAdminClient } from '../members/members-supabase-admin.util';

/**
 * A one-time link to the change-password page for this account, built by us
 * rather than by Supabase's own email.
 *
 * Supabase's emailed link only returns people to our site when the address is
 * on the project's redirect allow-list; otherwise it falls back to its Site
 * URL, which sent members to http://localhost:3000. generateLink creates the
 * recovery token without sending anything, and its hashed token is exchanged
 * on our page (POST /auth/recovery/verify), so no Supabase setting is involved.
 *
 * Returns null when there is no such account (or Supabase refuses), with the
 * reason, so callers can log it without telling the requester.
 */
export async function createRecoveryLink(
  email: string,
  siteUrl: string,
): Promise<{ link: string; reason?: undefined } | { link: null; reason: string }> {
  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: 'recovery', email });
  const hashed = data?.properties?.hashed_token;
  if (error || !hashed) return { link: null, reason: error?.message ?? 'no token returned' };
  const base = siteUrl.replace(/\/$/, '');
  return { link: `${base}/change-password?token_hash=${encodeURIComponent(hashed)}&type=recovery` };
}
