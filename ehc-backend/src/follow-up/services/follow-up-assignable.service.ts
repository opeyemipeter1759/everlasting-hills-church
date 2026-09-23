import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/**
 * Who may be given follow-up work.
 *
 * A Super Admin has access to everything but is never handed people to call:
 * the role exists to run the system, not to carry a share of the team's
 * workload, and putting them in the pickers means work quietly lands on
 * someone who was never going to do it. Every path that assigns — the picker,
 * a leader assigning by hand, the nightly auto-assign and bulk reassign —
 * goes through here so they cannot differ.
 */
@Injectable()
export class FollowUpAssignableService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** The subset of `memberIds` that hold an active SUPER_ADMIN grant. */
  async superAdminMemberIds(memberIds: string[]): Promise<Set<string>> {
    if (memberIds.length === 0) return new Set();
    const rows = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        id: { in: [...new Set(memberIds)] },
        Profile: { RoleGrantOf: { some: { role: Role.SUPER_ADMIN, endedAt: null } } },
      },
      select: { id: true },
    });
    return new Set(rows.map((r) => r.id));
  }

  async isSuperAdmin(memberId: string): Promise<boolean> {
    return (await this.superAdminMemberIds([memberId])).has(memberId);
  }

  /** Drops anyone who must not be assigned from a list of candidates. */
  async assignableOnly<T extends { id: string }>(candidates: T[]): Promise<T[]> {
    const excluded = await this.superAdminMemberIds(candidates.map((c) => c.id));
    return candidates.filter((c) => !excluded.has(c.id));
  }
}
