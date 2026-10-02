/**
 * The link that opens a reading plan ready to start, for sending to anyone in
 * the church. It names the plan by slug, so it always opens the newest
 * version, and someone signed out is brought back to it after logging in.
 *
 * Kept apart from the reading plan API client, which tests replace wholesale.
 */
export function planShareLink(slug: string, origin = typeof window === "undefined" ? "" : window.location.origin): string {
  return `${origin}/dashboard/reading/plans?plan=${encodeURIComponent(slug)}`;
}
