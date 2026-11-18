import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';

/** Who edits the opening message and sends it on WhatsApp: the Guest Care Coordinator, and church admins. Nobody emails it by hand. */
export const OPENING_SENDER_ROLES: Role[] = [Role.FIRST_TIMER_CONTACT, Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

export function canSendOpening(actor: AuthUser): boolean {
  return actor.effectiveRoles.some((r) => OPENING_SENDER_ROLES.includes(r));
}

/** The service-side check behind the route guard, so a mis-set decorator can never open these up. */
export function requireOpeningSender(actor: AuthUser): void {
  if (!canSendOpening(actor)) throw new ForbiddenException('Only the Guest Care Coordinator and admins can do this');
}
