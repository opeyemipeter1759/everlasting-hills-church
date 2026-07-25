import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class MemberHouseholdService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Find-or-create a Household by name within the tenant. Caches within one call site's run. */
  async resolveHousehold(
    name: string | undefined,
    cache: Map<string, string>,
  ): Promise<string | null> {
    const trimmed = name?.trim();
    if (!trimmed) return null;
    const key = trimmed.toLowerCase();
    if (cache.has(key)) return cache.get(key)!;

    const existing = await this.prisma.household.findFirst({
      where: { tenantId: this.tenantId, name: trimmed },
      select: { id: true },
    });
    const id =
      existing?.id ??
      (
        await this.prisma.household.create({
          data: { id: randomUUID(), tenantId: this.tenantId, name: trimmed },
          select: { id: true },
        })
      ).id;
    cache.set(key, id);
    return id;
  }
}
