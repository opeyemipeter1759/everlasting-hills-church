import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(32, 'SUPABASE_JWT_SECRET must be at least 32 chars'),

  DEFAULT_TENANT_ID: z.string().min(1),

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
  const data = parsed.data as unknown as Record<string, unknown>;
  // If SUPABASE_ANON_KEY is not provided but NEXT_PUBLIC_SUPABASE_ANON_KEY exists (from .env), use it.
  if (!data.SUPABASE_ANON_KEY && data.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    (data.SUPABASE_ANON_KEY as string) = String(data.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return data as Env;
}
