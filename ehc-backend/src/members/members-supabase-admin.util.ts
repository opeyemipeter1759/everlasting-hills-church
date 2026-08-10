import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import ws from 'ws';

/** Service-role Supabase client for admin-only operations (create/delete auth users). */
export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    '';
  if (!url || !key) throw new Error('Missing Supabase admin credentials');
  return createClient(url, key, { realtime: { transport: ws as unknown as WebSocketLikeConstructor } });
}

/** Normalize a free-text visitor gender ("Male"/"f"/"FEMALE") to MALE|FEMALE|null. */
export function normalizeGender(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase();
  if (v === 'MALE' || v === 'M') return 'MALE';
  if (v === 'FEMALE' || v === 'F') return 'FEMALE';
  return null;
}

/** Safely parse a visitor's free-text birthday string to a Date, or null. */
export function parseBirthday(raw?: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
