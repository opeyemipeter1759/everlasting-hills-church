import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { canActOnRole, assignableRoles } from '../role-hierarchy';

/** Authorization helpers + audit logging shared across the users module. */
@Injectable()
export class UsersAuthService {
  private readonly logger = new Logger(UsersAuthService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  assertCanActOn(actor: AuthUser, targetRole: Role) {
    if (!canActOnRole(actor.role, targetRole)) {
      throw new ForbiddenException(
        `Your role (${actor.role ?? 'none'}) cannot manage a ${targetRole}.`,
      );
    }
  }

  /** The target's highest effective role (grants + assignments), for hierarchy checks. */
  async targetPrimaryRole(profileId: string): Promise<Role> {
    return (await this.effectiveRoles.getEffectiveRoles(profileId)).primaryRole;
  }

  /** Exposed via GET /users/assignable-roles for frontend dropdown filtering. */
  assignableRolesFor(actor: AuthUser): Role[] {
    return assignableRoles(actor.role);
  }

  async writeAudit(actor: AuthUser, action: string, entityId: string, after: Prisma.InputJsonValue) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(), tenantId: this.tenantId, actorId: actor.userId,
          action, entity: 'RoleGrant', entityId, after,
        },
      });
    } catch (err) {
      this.logger.error(`Audit write failed (${action}): ${(err as Error).message}`);
    }
  }
}
