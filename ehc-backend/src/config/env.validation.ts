import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY must be set for the server'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY must be set for admin actions'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Tenant IDs in this project use a custom prefixed format (e.g. "ehc_9a893a..."), not UUIDs.
  // The Prisma Tenant model accepts any non-empty string @id.
  DEFAULT_TENANT_ID: z.string().min(8, 'DEFAULT_TENANT_ID must be at least 8 chars'),
  DEFAULT_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  DEFAULT_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),

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
  return parsed.data;
}
