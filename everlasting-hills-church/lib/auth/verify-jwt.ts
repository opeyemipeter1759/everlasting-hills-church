import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/** Edge-runtime-compatible Supabase ES256 JWT verifier via its public JWKS. */
export interface SupabaseJwtClaims extends JWTPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  aud?: string | string[];
  role?: string;
  app_metadata?: { role?: string; [key: string]: unknown };
}
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (cachedJWKS) return cachedJWKS;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set. Middleware cannot fetch JWKS without it.");
  }
  cachedJWKS = createRemoteJWKSet(
    new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
  );
  return cachedJWKS;
}

/**
 * Signature, issuer, audience, algorithm, and expiration are all mandatory.
 * Expired access tokens return null and must go through the server refresh flow.
 */
export async function verifySupabaseJwt(token: string): Promise<SupabaseJwtClaims | null> {
  if (!token) return null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { payload } = await jwtVerify(token, getJWKS(), {
      algorithms: ["ES256"],
      audience: "authenticated",
      issuer: `${supabaseUrl}/auth/v1`,
    });
    return payload as SupabaseJwtClaims;
  } catch {
    return null;
  }
}
