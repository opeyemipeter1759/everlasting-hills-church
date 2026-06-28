import type { Role } from '@prisma/client';
export interface AuthUser {
  userId: string;
  email: string;
  role: Role | null;
  profileId: string | null;
  memberId: string | null;
  tenantId: string | null;
}
