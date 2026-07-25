import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EffectiveRolesService } from '../../auth/effective-roles.service';

@Injectable()
export class UsersListService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(opts: { search?: string; role?: Role } = {}) {
    const profiles = await this.prisma.profile.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.search && {
          Member: {
            OR: [
              { firstName: { contains: opts.search, mode: 'insensitive' } },
              { lastName: { contains: opts.search, mode: 'insensitive' } },
              { email: { contains: opts.search, mode: 'insensitive' } },
            ],
          },
        }),
      },
      include: {
        Member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photoUrl: true,
            joinedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const eff = await this.effectiveRoles.getEffectiveRolesBatch(profiles.map((p) => p.id));
    const mapped = profiles.map((p) => {
      const e = eff.get(p.id);
      return {
        profileId: p.id,
        userId: p.userId,
        role: e?.primaryRole ?? Role.MEMBER,
        roles: e?.roles ?? [Role.MEMBER],
        createdAt: p.createdAt,
        member: p.Member,
      };
    });
    // Role filter is by effective-role membership (grants + assignments). ADMIN_HEAD
    // also matches legacy ADMIN holders (merged, same level).
    if (!opts.role) return mapped;
    const wanted = opts.role === Role.ADMIN_HEAD ? [Role.ADMIN_HEAD, Role.ADMIN] : [opts.role];
    return mapped.filter((m) => wanted.some((r) => m.roles.includes(r)));
  }
}
