import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import type { DirectoryRow } from '../members.types';

/** Batch-resolves the primary effective role for a page of member/directory rows. */
@Injectable()
export class MemberRoleResolverService {
  constructor(private readonly effectiveRoles: EffectiveRolesService) {}

  async pageRoleMap(rows: DirectoryRow[]): Promise<Map<string, Role>> {
    const profileIds = rows.map((r) => r.Profile?.id).filter((v): v is string => Boolean(v));
    const eff = await this.effectiveRoles.getEffectiveRolesBatch(profileIds);
    const map = new Map<string, Role>();
    for (const [pid, e] of eff) map.set(pid, e.primaryRole);
    return map;
  }
}
