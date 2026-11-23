import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CounsellingApplication, Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Who may see and do what in pre-marital counselling. Every endpoint goes
 * through here. Anything a person may not see answers 404, never 403, so a case
 * they cannot see does not even appear to exist.
 *
 *   Pastor            every case, including ones with a safeguarding concern
 *   Super Admin       every case except safeguarding ones; no wedding approval
 *   Marriage ministry every case except safeguarding ones; no assignment,
 *                     archive, deletion, wedding approval or safeguarding
 *   Counsellor        cases with their own active assignment, nothing else
 *
 * A later couple portal adds one more branch: the applicant's own case
 * (applicantUserId), without admin fields.
 */
export type StaffTier = 'PASTOR' | 'SUPER_ADMIN' | 'MINISTRY';
export type CaseTier = StaffTier | 'COUNSELLOR';

export const CAN = {
  triage: ['PASTOR', 'SUPER_ADMIN', 'MINISTRY'],
  assign: ['PASTOR', 'SUPER_ADMIN'],
  archive: ['PASTOR', 'SUPER_ADMIN'],
  /** Delete a whole application for good (CaseDeleteService). */
  delete: ['PASTOR', 'SUPER_ADMIN'],
  safeguarding: ['PASTOR'],
  wedding: ['PASTOR'],
  /** Read the policy, letters and documents settings. */
  policy: ['PASTOR', 'SUPER_ADMIN', 'MINISTRY'],
  settings: ['PASTOR'],
} as const satisfies Record<string, readonly CaseTier[]>;
export type Capability = keyof typeof CAN;

export const notFound = () => new NotFoundException('Not found');

function rolesOf(actor: AuthUser): Role[] {
  return actor.effectiveRoles?.length
    ? actor.effectiveRoles
    : actor.role
      ? [actor.role]
      : [];
}

export function staffTierOf(actor: AuthUser): StaffTier | null {
  const roles = rolesOf(actor);
  if (roles.includes(Role.PASTOR)) return 'PASTOR';
  if (roles.includes(Role.SUPER_ADMIN)) return 'SUPER_ADMIN';
  if (roles.includes(Role.MARRIAGE_MINISTRY)) return 'MINISTRY';
  return null;
}

export function can(tier: CaseTier | null, capability: Capability): boolean {
  return !!tier && (CAN[capability] as readonly CaseTier[]).includes(tier);
}

/** For someone who may see the case but not do this to it. */
export function requireCan(tier: CaseTier, capability: Capability): void {
  if (!can(tier, capability))
    throw new ForbiddenException('That is not part of your role on this case');
}

@Injectable()
export class CaseAccess {
  readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** The case if this person may see it, and in which role; otherwise 404. */
  async open(
    actor: AuthUser,
    applicationId: string,
  ): Promise<{ app: CounsellingApplication; tier: CaseTier }> {
    const app = await this.prisma.counsellingApplication.findFirst({
      where: { id: applicationId, tenantId: this.tenantId },
    });
    if (!app) throw notFound();
    const staff = staffTierOf(actor);
    if (app.safeguardingFlaggedAt && staff !== 'PASTOR') throw notFound();
    if (staff) {
      if (app.archivedAt && !can(staff, 'archive')) throw notFound();
      return { app, tier: staff };
    }
    if (app.archivedAt || !actor.profileId) throw notFound();
    const assigned = await this.prisma.counsellingAssignment.findFirst({
      where: {
        tenantId: this.tenantId,
        applicationId,
        counsellorProfileId: actor.profileId,
        active: true,
      },
      select: { id: true },
    });
    if (!assigned) throw notFound();
    return { app, tier: 'COUNSELLOR' };
  }

  /** Whether this person counsels any case at all. */
  async isCounsellor(actor: AuthUser): Promise<boolean> {
    if (!actor.profileId) return false;
    const one = await this.prisma.counsellingAssignment.findFirst({
      where: {
        tenantId: this.tenantId,
        counsellorProfileId: actor.profileId,
        active: true,
      },
      select: { id: true },
    });
    return !!one;
  }

  /** Staff tier, or 404 for anyone else. */
  requireStaff(actor: AuthUser, capability: Capability): StaffTier {
    const tier = staffTierOf(actor);
    if (!tier) throw notFound();
    requireCan(tier, capability);
    return tier;
  }

  /** Staff, or a counsellor with at least one case; 404 for anyone else. */
  async requireStaffOrCounsellor(actor: AuthUser): Promise<CaseTier> {
    const tier = staffTierOf(actor);
    if (tier) return tier;
    if (await this.isCounsellor(actor)) return 'COUNSELLOR';
    throw notFound();
  }
}
