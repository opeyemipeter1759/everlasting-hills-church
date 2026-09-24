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
  // Used in account invitation/deactivation links. The historical name is
  // retained because the frontend also consumes it at build time.
  NEXT_PUBLIC_APP_URL: z.url().optional(),

  // Read directly by the CORS origin callback in main.ts.
  CORS_EXTRA_ORIGINS: z.string().optional(),
  CORS_ALLOW_VERCEL_PREVIEWS: z.enum(['true', 'false']).optional(),

  // Public CMS signatures require independent, rotatable secrets. Deliberately
  // no literal or JWT-secret fallback is accepted.
  CMS_PREVIEW_SECRET: z.string().min(32),
  CMS_REVALIDATE_SECRET: z.string().min(32),

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

  /**
   * Scheduled jobs. Production runs on Cloud Run with scale-to-zero, where an
   * in-process timer only fires if a request happens to keep an instance warm —
   * so the schedule lives in Cloud Scheduler, which POSTs /jobs/:name with
   * CRON_SECRET. CRON_ENABLED=true turns the in-process @Cron timers back on
   * for an always-on host; leave it off on Cloud Run and on dev machines that
   * point at the production database (two schedulers = duplicate reminders).
   */
  CRON_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  CRON_SECRET: z.string().min(16).optional(),

  /** Error monitoring (Sentry). Absent → Sentry is a no-op. */
  SENTRY_DSN: z.url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),

  /** Paystack giving. Absent → giving endpoints return 503. */
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),

  /** Gemini (prayer-request AI triage). Absent → triage is skipped, request still saves. */
  GEMINI_API_KEY: z.string().min(1).optional(),
  /**
   * Gemini models to try, in order, comma-separated. Google turns away one
   * model at a time when it is busy (503 "high demand"), so a request moves
   * down the list. Absent → the defaults in src/ai/gemini-client.ts.
   */
  GEMINI_MODELS: z.string().min(1).optional(),

  /**
   * YouTube Data API, server side, for the sermon digest (Word of the Day).
   * Needs a key with no HTTP-referrer restriction. Absent → the digest job
   * does nothing. YOUTUBE_SERVICES_PLAYLIST_ID, when set, limits the digest
   * to that playlist of full services.
   */
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  YOUTUBE_CHANNEL_ID: z.string().min(1).optional(),
  YOUTUBE_SERVICES_PLAYLIST_ID: z.string().min(1).optional(),

  /**
   * Cloudflare R2 object storage. Absent → upload endpoints return 503.
   * R2_ENDPOINT is auto-derived from R2_ACCOUNT_ID if omitted.
   * R2_BUCKET falls back to R2_ACCOUNT_ID if omitted (not ideal — set explicitly).
   * R2_PUBLIC_URL is the public base URL for uploaded files (e.g. https://cdn.example.com).
   */
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  // Deprecated runtime alias. Prefer R2_BUCKET; do not set both differently.
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_ENDPOINT: z.url().optional(),
  R2_PUBLIC_URL: z.url().optional(),

  /**
   * Generic file uploads (uploads.service.ts — book covers/PDFs, announcement
   * attachments, etc). This project has no R2 credentials, so uploads live in
   * Supabase Storage instead, reusing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
   * above. Bucket must be created and public (see ehc-uploads).
   */
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('ehc-uploads'),

  /**
   * Web Push (VAPID). Absent → push endpoints return 503 and scheduled dispatch
   * is skipped, following the same optional-integration pattern as Resend,
   * Paystack and R2 above.
   *
   * Generate with:
   *   node -e "console.log(require('web-push').generateVAPIDKeys())"
   *
   * The public key is also needed by the browser as NEXT_PUBLIC_VAPID_PUBLIC_KEY.
   * Rotating the keypair silently invalidates every stored PushSubscription, so
   * rotate only alongside a prune of that table.
   */
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  /** Contact URI the push service can reach the operator at. */
  VAPID_SUBJECT: z
    .string()
    .regex(/^(mailto:|https:\/\/)/, 'VAPID_SUBJECT must start with mailto: or https://')
    .optional(),

  /**
   * Google Calendar OAuth (import the member's own personal calendar).
   * Absent → the connect/disconnect/status/events endpoints return 503,
   * following the same optional-integration pattern as Paystack/R2/VAPID above.
   *
   * Create the OAuth client in Google Cloud Console (APIs & Services →
   * Credentials → OAuth client ID → Web application), enable the Google
   * Calendar API, and add GOOGLE_OAUTH_REDIRECT_URI as an authorized redirect
   * URI. Scope requested is calendar.readonly — this feature only ever reads.
   *
   * GOOGLE_TOKEN_ENCRYPTION_KEY is a 32-byte key, base64-encoded, used to
   * encrypt stored access/refresh tokens at rest (AES-256-GCM). Generate with:
   *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   * Required alongside the OAuth client vars — rotating it invalidates every
   * stored connection, which then reconnects on next use.
   */
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.url().optional(),
  GOOGLE_TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
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
