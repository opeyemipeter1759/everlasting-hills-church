/**
 * Opens a password-reset link on the change-password page.
 *
 * Our reset email links with ?token_hash=…&type=recovery; Supabase's older
 * email used #access_token=…&type=recovery. Either is erased from the address
 * bar at once and exchanged by /api/auth/recovery for an HttpOnly cookie.
 *
 * Returns false when the page wasn't opened from a reset link; throws when the
 * link is used or expired.
 */
export async function openRecoveryLink(): Promise<boolean> {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const tokenHash = query.get("type") === "recovery" ? query.get("token_hash") : null;
  const accessToken = hash.get("type") === "recovery" ? hash.get("access_token") : null;
  if (!tokenHash && !accessToken) return false;

  // Erase the token before any further navigation, telemetry, or interaction.
  window.history.replaceState(null, "", window.location.pathname);
  const response = await fetch("/api/auth/recovery", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tokenHash ? { tokenHash } : { accessToken }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("This password-reset link is invalid or has expired. Request a new one from Forgot password.");
  }
  return true;
}
