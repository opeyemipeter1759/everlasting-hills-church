import { getLandingPage } from "./frontend-session";
import { safeNextPath } from "./safe-next-path";

/**
 * Where someone goes once they have signed in: a required password change
 * first, then the page that sent them to log in (the middleware adds ?next=,
 * so a reading plan link they were sent still opens), else their landing page.
 */
export function postLoginPath(
  user: { needsPasswordChange?: boolean | null; role?: string | null },
  search: string,
): string {
  if (user.needsPasswordChange) return "/change-password";
  return safeNextPath(new URLSearchParams(search).get("next")) ?? getLandingPage(user.role);
}
