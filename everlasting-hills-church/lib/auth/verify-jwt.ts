import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Edge-runtime-compatible Supabase JWT verifier (asymmetric ES256 via JWKS).
 *
 * Why JWKS instead of a shared secret:
 *  - Supabase migrated this project to ES256 asymmetric keys on 2026-05-20
 *  - We never possess the private key — Supabase signs, we verify with the public key
 *  - JWKS fetched once, cached, auto-refreshed on key rotation (kid header)
 *  - No secret to leak; SUPABASE_JWT_SECRET is no longer needed anywhere
 *
 * jose's createRemoteJWKSet:
 *  - Edge-runtime compatible (uses native fetch, no Node-only APIs)
 *  - Caches keys in memory (default 10 min)
 *  - Auto-refetches when a token with an unknown `kid` arrives (key rotation)
 *
 * Algorithms allowed:
 *  - ES256 — Supabase's current signing key
 *  - HS256 — kept temporarily so already-issued legacy tokens still verify until they expire.
 *    Note: HS256 tokens won't actually verify here because jose's createRemoteJWKSet only
 *    serves asymmetric keys; the algorithm list just allows them through to the next step.
 *    Once all pre-rotation tokens expire (≤1h after rotation), the HS256 entry can be dropped.
 */
export interface SupabaseJwtClaims extends JWTPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  aud?: string | string[];
  role?: string;
  /** Supabase includes admin-controlled app_metadata in the access token. We put the
   *  authoritative app role here so the middleware can verify it cryptographically. */
  app_metadata?: { role?: string; [key: string]: unknown };
}

let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (cachedJWKS) return cachedJWKS;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Middleware cannot fetch JWKS without it.",
    );
  }
  cachedJWKS = createRemoteJWKSet(
    new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
  );
  return cachedJWKS;
}

export async function verifySupabaseJwt(
  token: string,
  options: { ignoreExpiration?: boolean } = {},
): Promise<SupabaseJwtClaims | null> {
  if (!token) return null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { payload } = await jwtVerify(token, getJWKS(), {
      algorithms: ["ES256"],
      audience: "authenticated",
      issuer: `${supabaseUrl}/auth/v1`,
      // A large clockTolerance effectively ignores the exp claim while still
      // verifying the cryptographic signature. Used by the middleware so that
      // an expired access token does not kick the user out — the axios interceptor
      // will silently refresh it on the next API call.
      ...(options.ignoreExpiration ? { clockTolerance: 10 * 365 * 24 * 3600 } : {}),
    });
    return payload as SupabaseJwtClaims;
  } catch {
    return null;
  }
}
