import type { Role } from '@prisma/client';

/**
 * Shape attached to req.user after JwtAuthGuard runs.
 *
 * userId: Supabase auth user id (from JWT `sub`).
 * email:  from JWT `email` claim.
 * role:   from Profile.role looked up at request time.
 *         Null when the JWT is valid but the user has no Profile yet (e.g. just registered).
 * profileId / memberId: convenience IDs to avoid re-fetching in controllers.
 */
export interface AuthUser {
  userId: string;
  email: string;
  role: Role | null;
  profileId: string | null;
  memberId: string | null;
  tenantId: string | null;
}
