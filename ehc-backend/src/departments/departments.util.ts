import { Role } from '@prisma/client';

export { parseSchema } from '../common/zod-parse.util';

// ADMIN_HEAD is merged with ADMIN (same level) — full church-wide access, not
// scoped to a specific department. Department-scoping still applies to anyone
// whose ADMIN_HEAD comes only from heading one department.
export const MANAGE_ROLES: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

export type ProfileWithMember = {
  id: string;
  Member: { firstName: string; lastName: string; photoUrl: string | null } | null;
};

export function personLabel(p: ProfileWithMember | null) {
  if (!p) return null;
  const m = p.Member;
  return {
    profileId: p.id,
    name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Unknown',
    photoUrl: m?.photoUrl ?? null,
  };
}
