import { Role } from '@prisma/client';

/** Mirrors the frontend's ROLE_LABEL (peopleShared/roleMeta.ts) for server-rendered audience labels. */
export const ROLE_LABEL: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.PASTOR]: 'Pastor',
  [Role.ADMIN]: 'Admin',
  [Role.ADMIN_HEAD]: 'Admin Head',
  [Role.HOD]: 'Head of Department',
  [Role.HEAD_USHER]: 'Head Usher',
  [Role.UNIT_LEAD]: 'Unit Lead',
  [Role.MEMBER]: 'Member',
  [Role.VISITOR]: 'Visitor',
};
