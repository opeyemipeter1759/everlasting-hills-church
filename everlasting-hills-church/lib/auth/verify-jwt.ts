import { jwtVerify } from "jose";

/**
 * Edge-runtime-compatible Supabase JWT verifier.
 *
 * Uses HS256 (Supabase default). The shared secret must be available to the Next.js server
 * runtime (NOT the browser — never prefix with NEXT_PUBLIC_).
 *
 * Returns the decoded payload on success, null on any verification failure (expired, bad
 * signature, wrong audience). The caller treats null as "not authenticated."
 */
export interface SupabaseJwtClaims {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  aud?: string | string[];
  role?: string;
  [key: string]: unknown;
}

let cachedKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET is not set. Middleware cannot verify JWTs without it.",
    );
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function verifySupabaseJwt(token: string): Promise<SupabaseJwtClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
      audience: "authenticated",
    });
    return payload as SupabaseJwtClaims;
  } catch {
    return null;
  }
}
