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
 *
 * Uses Zod v4's top-level format helpers (z.url(), z.email()) — the chained .url()/.email()
 * on z.string() is deprecated in v4.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),

  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  DEFAULT_SUPER_ADMIN_EMAIL: z.email().optional(),
  DEFAULT_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),

  // Tenant IDs in this project use a custom prefixed format (e.g. "ehc_9a893a..."), not UUIDs.
  DEFAULT_TENANT_ID: z
    .string()
    .min(8, 'DEFAULT_TENANT_ID must be at least 8 chars'),

  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.email().optional(),
  RESEND_ADMIN_EMAIL: z.email().optional(),
  CONTACT_EMAIL: z.email().optional(),

  FRONTEND_URL: z.url().optional(),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  // Attendance service windows — WAT (UTC+1), 24h "HH:MM" format.
  ATTENDANCE_SUNDAY_OPEN: z.string().regex(/^\d{2}:\d{2}$/).default('08:30'),
  ATTENDANCE_SUNDAY_CLOSE: z.string().regex(/^\d{2}:\d{2}$/).default('13:00'),
  ATTENDANCE_WEDNESDAY_OPEN: z.string().regex(/^\d{2}:\d{2}$/).default('17:30'),
  ATTENDANCE_WEDNESDAY_CLOSE: z.string().regex(/^\d{2}:\d{2}$/).default('21:00'),
  // Override the current time for testing (ISO 8601). Leave blank in production.
  ATTENDANCE_TEST_NOW: z.string().optional(),
  // Force the attendance window open regardless of day/time. Testing only.
  ATTENDANCE_FORCE_OPEN: z
    .string()
    .transform((v) => v === 'true')
    .optional(),

  /** Background jobs (BullMQ). Absent → falls back to in-process EventEmitter. */
  REDIS_URL: z.url().optional(),

  /** Error monitoring (Sentry). Absent → Sentry is a no-op. */
  SENTRY_DSN: z.url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),

  /** Paystack giving. Absent → giving endpoints return 503. */
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
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
    throw new Error(
      'Either SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set',
    );
  }

  return data as Env;
}
