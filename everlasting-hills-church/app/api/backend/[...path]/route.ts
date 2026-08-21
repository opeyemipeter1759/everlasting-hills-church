import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/backend-url";
import {
  accessTokenNeedsRefresh,
  clearSessionCookies,
  getBackendSession,
  setSessionCookies,
  withoutSessionTokens,
  type BackendSession,
} from "@/lib/auth/server-session";
import {
  ACCESS_TOKEN_COOKIE,
  isLogoutPending,
  LOGOUT_PENDING_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/session-constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { path: string[] } };
type ProxyBody = BodyInit | null | undefined;

const SAFE_RESPONSE_HEADERS = new Set([
  "accept-ranges",
  "cache-control",
  "content-disposition",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
  "retry-after",
  "x-request-id",
]);

function backendUrl(request: NextRequest, path: string[]): string {
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  return `${getBackendBaseUrl()}/${encodedPath}${request.nextUrl.search}`;
}

function isUnsafeCrossSiteRequest(request: NextRequest): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return true;
  const origin = request.headers.get("origin");
  return Boolean(origin && origin !== request.nextUrl.origin);
}

function forwardHeaders(request: NextRequest, accessToken?: string | null): Headers {
  const headers = new Headers();
  for (const name of ["accept", "accept-language", "content-type", "if-none-match", "range", "user-agent"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Do not forward a browser-supplied x-forwarded-for value. The backend uses
  // its first entry for login audit/security events, so an untrusted value would
  // turn those records into attacker-controlled data. The deployment proxy may
  // add its own trusted client-IP header on the server-to-server hop.
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  return headers;
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, name) => {
    if (SAFE_RESPONSE_HEADERS.has(name.toLowerCase())) headers.set(name, value);
  });
  return headers;
}

async function fetchBackend(
  request: NextRequest,
  url: string,
  accessToken: string | null,
  body: ProxyBody,
): Promise<Response> {
  const init = {
    method: request.method,
    headers: forwardHeaders(request, accessToken),
    body,
    redirect: "manual",
    cache: "no-store",
    ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
  } as RequestInit & { duplex?: "half" };
  return fetch(url, init);
}

async function readProxyBody(request: NextRequest): Promise<{ body: ProxyBody; replayable: boolean }> {
  if (request.method === "GET" || request.method === "HEAD") return { body: undefined, replayable: true };
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    // Keep uploads streaming. Proactive token refresh happens before this body is
    // consumed, so a normal expiry never requires buffering/replaying the file.
    return { body: request.body, replayable: false };
  }
  return { body: await request.arrayBuffer(), replayable: true };
}

async function refreshBackend(refreshToken: string): Promise<{
  upstream: Response;
  json: unknown | null;
  session: BackendSession | null;
}> {
  const upstream = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  let json: unknown | null = null;
  try {
    json = await upstream.json();
  } catch {
    // Preserve the status even if an upstream proxy returned non-JSON.
  }
  return { upstream, json, session: upstream.ok ? getBackendSession(json) : null };
}

function jsonProxyResponse(upstream: Response, value: unknown): NextResponse {
  return NextResponse.json(value, {
    status: upstream.status,
    headers: responseHeaders(upstream),
  });
}

async function proxy(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  if (isUnsafeCrossSiteRequest(request)) {
    return NextResponse.json(
      { error: { statusCode: 403, code: "CSRF_REJECTED", message: "Cross-site request rejected" } },
      { status: 403 },
    );
  }

  const path = context.params.path ?? [];
  if (!path.length) return NextResponse.json({ error: { message: "API path is required" } }, { status: 404 });
  const pathKey = path.join("/");
  const isLogin = pathKey === "auth/login";
  const isRefresh = pathKey === "auth/refresh";
  const isLogout = pathKey === "auth/logout";
  if ((isLogin || isRefresh || isLogout) && request.method !== "POST") {
    return NextResponse.json(
      { error: { statusCode: 405, code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } },
      { status: 405, headers: { allow: "POST" } },
    );
  }
  const suppressPendingSession =
    isLogoutPending(request.cookies.get(LOGOUT_PENDING_COOKIE)?.value) && !isLogout;
  let accessToken = suppressPendingSession
    ? null
    : request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = suppressPendingSession
    ? null
    : request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  let refreshedSession: BackendSession | null = null;
  let refreshFailed = false;

  if (isRefresh) {
    if (!refreshToken) {
      const response = NextResponse.json(
        { error: { statusCode: 401, code: "UNAUTHORIZED", message: "Session expired. Please sign in again." } },
        { status: 401 },
      );
      clearSessionCookies(response);
      return response;
    }
    const refreshed = await refreshBackend(refreshToken);
    const response = jsonProxyResponse(refreshed.upstream, withoutSessionTokens(refreshed.json));
    if (refreshed.session) setSessionCookies(response, refreshed.session);
    else clearSessionCookies(response);
    response.headers.set("cache-control", "no-store");
    return response;
  }

  // Refresh before forwarding a potentially large/non-replayable upload.
  if (!isLogin && refreshToken && accessTokenNeedsRefresh(accessToken)) {
    const refreshed = await refreshBackend(refreshToken);
    if (refreshed.session) {
      refreshedSession = refreshed.session;
      accessToken = refreshed.session.access_token;
    } else {
      refreshFailed = true;
      accessToken = null;
    }
  }

  const { body, replayable } = await readProxyBody(request);
  let upstream = await fetchBackend(request, backendUrl(request, path), isLogin ? null : accessToken, body);

  // A still-valid-looking token can be revoked. Retry once when the body is safe
  // to replay; streamed multipart requests rely on the proactive refresh above.
  if (
    upstream.status === 401 &&
    !isLogin &&
    !refreshFailed &&
    !refreshedSession &&
    refreshToken &&
    replayable
  ) {
    const refreshed = await refreshBackend(refreshToken);
    if (refreshed.session) {
      refreshedSession = refreshed.session;
      accessToken = refreshed.session.access_token;
      upstream = await fetchBackend(request, backendUrl(request, path), accessToken, body);
    } else {
      refreshFailed = true;
    }
  }

  if (isLogin) {
    let json: unknown = null;
    try {
      json = await upstream.json();
    } catch {
      return new NextResponse(null, { status: upstream.status, headers: responseHeaders(upstream) });
    }
    const session = upstream.ok ? getBackendSession(json) : null;
    const response = jsonProxyResponse(upstream, withoutSessionTokens(json));
    // A login attempt always starts from a clean browser session so a shared
    // device cannot retain another account's rotated refresh/UI cookies.
    clearSessionCookies(response);
    if (session) setSessionCookies(response, session);
    response.headers.set("cache-control", "no-store");
    return response;
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders(upstream),
  });
  if (refreshedSession) setSessionCookies(response, refreshedSession);
  if (suppressPendingSession || refreshFailed || upstream.status === 401 || isLogout) {
    clearSessionCookies(response);
  }
  if (refreshedSession || accessToken || isLogout) response.headers.set("cache-control", "no-store");
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
