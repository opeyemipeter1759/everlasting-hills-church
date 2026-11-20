import { COUPLE_HOME } from "./couple-routing";
import { getLandingPage } from "./frontend-session";
import { safeNextPath } from "./safe-next-path";

/**
 * Where someone goes once they have signed in: a required password change
 * first, then the page that sent them to log in (the middleware adds ?next=,
 * so a reading plan link they were sent still opens), else their landing page.
 * A couple dashboard account (pre-marital counselling, no church role) lands
 * on its dashboard.
 */
export function postLoginPath(
  user: { needsPasswordChange?: boolean | null; role?: string | null; account?: string | null },
  search: string,
): string {
  if (user.needsPasswordChange) return "/change-password";
  const home = user.account === "COUPLE" && !user.role ? COUPLE_HOME : getLandingPage(user.role);
  return safeNextPath(new URLSearchParams(search).get("next")) ?? home;
}
