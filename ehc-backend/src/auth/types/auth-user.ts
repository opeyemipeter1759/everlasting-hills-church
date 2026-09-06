import type { Role } from '@prisma/client';
export interface AuthUser {
  userId: string;
  email: string;
  /**
   * Highest-level effective role (derived from grants + assignments), for
   * hierarchy checks. NOT the legacy single-role column. MEMBER when nothing else.
   */
  role: Role | null;
  /** Full effective role set: MEMBER + grants + roles derived from assignments. */
  effectiveRoles: Role[];
  /** Scopes for the derived roles. */
  unitLeadOf: string[];
  /** Department ids this person heads. Heading one is an HOD scope, not admin. */
  hodOf: string[];
  headUsher: boolean;
  profileId: string | null;
  memberId: string | null;
  tenantId: string | null;
}
