import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

/**
 * What the API proxy adds on its way through: the visitor's IP, signed. The
 * API only ever sees this server's address, so it cannot rate-limit per
 * visitor by itself. We take the IP from the last X-Forwarded-For entry, the
 * one Google's front end appends (anything earlier in that header came from
 * the browser and is never trusted), and sign it with a timestamp using
 * CLIENT_IP_SIGNING_SECRET from Secret Manager. Without the secret nothing is
 * added and the API falls back to its stricter shared limit.
 */
const IP = /^[0-9A-Fa-f:.]{2,45}$/;

export function trustedClientIp(forwardedFor: string | null): string | null {
  const last = forwardedFor?.split(",").pop()?.trim();
  return last && IP.test(last) ? last : null;
}

export function signClientIp(ip: string, timestamp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${ip}.${timestamp}`).digest("hex");
}

export function addProxyHeaders(
  request: NextRequest,
  headers: Headers,
  secret = process.env.CLIENT_IP_SIGNING_SECRET,
  nowMs = Date.now(),
): void {
  const ip = secret ? trustedClientIp(request.headers.get("x-forwarded-for")) : null;
  if (ip && secret) {
    const ts = Math.floor(nowMs / 1000);
    headers.set("x-ehc-client-ip", ip);
    headers.set("x-ehc-client-ip-ts", String(ts));
    headers.set("x-ehc-client-ip-sig", signClientIp(ip, ts, secret));
  }
}
