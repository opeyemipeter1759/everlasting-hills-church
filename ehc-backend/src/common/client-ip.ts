import { createHmac, timingSafeEqual } from 'crypto';

/**
 * The visitor's IP, as signed by our own website.
 *
 * Browsers reach the API through the website's proxy, so the API itself only
 * ever sees the website server's address. The proxy therefore sends the
 * visitor's IP (taken from Google's forwarding header, never from anything the
 * browser controls) with a timestamp and an HMAC made with a secret both
 * services get from Secret Manager (CLIENT_IP_SIGNING_SECRET).
 *
 * A missing, wrong or stale signature is simply ignored: the request is then
 * counted under the address the API sees, which for website traffic is one
 * shared bucket. That is stricter, never looser, than counting per visitor.
 */
export const CLIENT_IP_HEADER = 'x-ehc-client-ip';
export const CLIENT_IP_TS_HEADER = 'x-ehc-client-ip-ts';
export const CLIENT_IP_SIG_HEADER = 'x-ehc-client-ip-sig';
/** How old a signature may be, either way, in seconds. */
export const CLIENT_IP_MAX_SKEW = 60;

const IP = /^[0-9A-Fa-f:.]{2,45}$/;

export function signClientIp(ip: string, timestamp: number, secret: string): string {
  return createHmac('sha256', secret).update(`${ip}.${timestamp}`).digest('hex');
}

type Headers = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The signed visitor IP, or null when there is none or it does not check out. */
export function verifiedClientIp(headers: Headers, secret: string | undefined, nowMs = Date.now()): string | null {
  if (!secret) return null;
  const ip = one(headers[CLIENT_IP_HEADER])?.trim();
  const ts = Number(one(headers[CLIENT_IP_TS_HEADER]));
  const sig = one(headers[CLIENT_IP_SIG_HEADER])?.trim();
  if (!ip || !IP.test(ip) || !Number.isInteger(ts) || !sig || !/^[0-9a-f]{64}$/.test(sig)) return null;
  if (Math.abs(nowMs / 1000 - ts) > CLIENT_IP_MAX_SKEW) return null;
  const expected = Buffer.from(signClientIp(ip, ts, secret), 'hex');
  const given = Buffer.from(sig, 'hex');
  return expected.length === given.length && timingSafeEqual(expected, given) ? ip : null;
}
