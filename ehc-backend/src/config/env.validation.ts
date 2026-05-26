import { z } from 'zod';

/**
 * Single source of truth for env vars consumed by the backend.
 *
 * Note: SUPABASE_JWT_SECRET is NOT used — this project's Supabase instance was migrated to
 * asymmetric ES256 signing keys. JwtStrategy fetches the public key from
 *   <SUPABASE_URL>/auth/v1/.well-known/jwks.json
 * via jwks-rsa. No shared secret to synchronize between services.
 *
 * NEXT_PUBLIC_SUPABASE_ANON_KEY is accepted as a fallback so the same .env file can serve
 * both frontend (which prefixes vars with NEXT_PUBLIC_) and backend.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Tenant IDs in this project use a custom prefixed format (e.g. "ehc_9a893a..."), not UUIDs.
  DEFAULT_TENANT_ID: z.string().min(8, 'DEFAULT_TENANT_ID must be at least 8 chars'),

  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.string().email().optional(),
  RESEND_ADMIN_EMAIL: z.string().email().optional(),
  CONTACT_EMAIL: z.string().email().optional(),

  FRONTEND_URL: z.string().url().optional(),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  const data = parsed.data as Record<string, unknown>;

  // Either name works; normalize so services read SUPABASE_ANON_KEY only.
  if (!data.SUPABASE_ANON_KEY && data.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    data.SUPABASE_ANON_KEY = data.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (!data.SUPABASE_ANON_KEY) {
    throw new Error('Either SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  return data as Env;
}
