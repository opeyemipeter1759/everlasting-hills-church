import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';

/** Who edits the opening message and sends it: the first-timer contact, and church admins. */
export const OPENING_SENDER_ROLES: Role[] = [Role.FIRST_TIMER_CONTACT, Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

export function canSendOpening(actor: AuthUser): boolean {
  return actor.effectiveRoles.some((r) => OPENING_SENDER_ROLES.includes(r));
}

/** Who may email the opening message: the admins. The Guest Care Coordinator sends on WhatsApp only. */
export const OPENING_EMAIL_ROLES: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

export function canEmailOpening(actor: AuthUser): boolean {
  return actor.effectiveRoles.some((r) => OPENING_EMAIL_ROLES.includes(r));
}

export function requireOpeningEmailer(actor: AuthUser): void {
  if (!canEmailOpening(actor)) throw new ForbiddenException('Only admins can email the opening message; the Guest Care Coordinator sends it on WhatsApp');
}

/** The service-side check behind the route guard, so a mis-set decorator can never open these up. */
export function requireOpeningSender(actor: AuthUser): void {
  if (!canSendOpening(actor)) throw new ForbiddenException('Only the Guest Care Coordinator and admins can do this');
}
