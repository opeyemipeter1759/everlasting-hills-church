/** Pages that sign someone in, never a place to send them back to afterwards. */
export const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);

/**
 * A same-site path to return to after login; another site ("//evil.com") or a
 * login page is ignored. Shared by the middleware, which adds ?next= when it
 * sends a signed-out visitor to log in, and the login form, which honours it,
 * so a link someone was sent, such as a reading plan, survives signing in.
 */
export function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  // Browsers drop tabs and newlines from a URL and read a backslash as a
  // slash, so "/<tab>/evil.com" or "/\evil.com" would leave the site. No real
  // path here has either, so refuse them anywhere rather than only up front.
  for (let index = 0; index < next.length; index += 1) {
    const code = next.charCodeAt(index);
    if (code < 0x20 || code === 0x7f || next[index] === "\\") return null;
  }
  return AUTH_PAGES.has(next.split("?")[0]) ? null : next;
}
