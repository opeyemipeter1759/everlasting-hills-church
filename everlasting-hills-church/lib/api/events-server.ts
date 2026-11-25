import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-constants";
import { serverApi } from "@/lib/api/server";

/** Whether the visitor has a session cookie (private events are for signed-in users). */
export function isSignedIn(): boolean {
  return Boolean(cookies().get(ACCESS_TOKEN_COOKIE)?.value);
}

/**
 * GET an events endpoint as the current visitor.
 *
 * Anonymous visitors share one cached, public-only response. Signed-in users send
 * their token so PRIVATE events are included, and skip the shared cache — a
 * members-only event must never be cached into the anonymous response.
 */
export function getEventsAsViewer<T>(path: string, tags: string[] = ["events"]): Promise<T> {
  return isSignedIn()
    ? serverApi.get<T>(path, { withAuth: true, cache: "no-store" })
    : serverApi.get<T>(path, { withAuth: false, revalidate: 300, tags });
}
