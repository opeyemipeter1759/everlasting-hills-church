import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/backend-url";

/**
 * Google's registered redirect_uri points here — on the app's own branded
 * domain — rather than straight at the Nest API's separate host. This route
 * does nothing but forward Google's query string (code/state/error) on to
 * the real handler, which verifies `state` and does the code exchange; the
 * member's identity travels in that signed `state`, not in anything this
 * route needs to check, so it stays exempt from the dashboard auth gate in
 * middleware.ts (a dropped session between "connect" and Google's redirect
 * back shouldn't be able to strand the user on a login wall mid-flow).
 */
export async function GET(request: NextRequest) {
  const target = `${getBackendBaseUrl()}/calendar/google/callback${request.nextUrl.search}`;
  return NextResponse.redirect(target);
}
