import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NavGrantType, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../types/auth-user';

/** How long page permissions are reused before being re-read (saves a query per API call). */
const CACHE_TTL_MS = 30_000;
/** Upper bound on cached people, so the cache can't grow without limit. */
const MAX_CACHED_ACTORS = 5_000;

/**
 * Answers "has this person been given this page?" through either layer of the
 * Role Access Permissions screen: a saved role list for the page that includes
 * one of their roles, or a named grant (to them, a unit they're in, or a unit
 * they lead). Mirrors the frontend's page check, so the API honours exactly
 * the permissions that let the person onto the page.
 *
 * Results are cached briefly; NavPermissionsService calls invalidate() on
 * every change so an edit takes effect on the next request.
 */
@Injectable()
export class PageAccessService {
  private readonly tenantId: string;
  private roleTable: { byHref: Map<string, Role[]>; expires: number } | null = null;
  private readonly grantCache = new Map<string, { hrefs: Set<string>; expires: number }>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  invalidate(): void {
    this.roleTable = null;
    this.grantCache.clear();
  }

  async canReach(actor: AuthUser, href: string): Promise<boolean> {
    const actorRoles = new Set<Role>(actor.effectiveRoles ?? []);
    if (actor.role) actorRoles.add(actor.role);
    const pageRoles = (await this.getRoleTable()).get(href);
    if (pageRoles?.some((role) => actorRoles.has(role))) return true;
    return (await this.getCachedGrants(actor)).has(href);
  }

  /**
   * The pages this specific person can reach through a named exception,
   * independent of their role — a MEMBER grant on their own profileId, or a
   * UNIT_MEMBER/UNIT_LEAD grant on any unit they belong to/lead.
   */
  async getGrantedHrefsForActor(actor: AuthUser): Promise<string[]> {
    const memberUnitIds = actor.memberId
      ? (
          await this.prisma.unitMember.findMany({
            where: { tenantId: this.tenantId, memberId: actor.memberId },
            select: { unitId: true },
          })
        ).map((m) => m.unitId)
      : [];

    const or: Array<{ type: NavGrantType; targetId: { in: string[] } }> = [];
    if (actor.profileId) or.push({ type: NavGrantType.MEMBER, targetId: { in: [actor.profileId] } });
    if (memberUnitIds.length) or.push({ type: NavGrantType.UNIT_MEMBER, targetId: { in: memberUnitIds } });
    if (actor.unitLeadOf.length) or.push({ type: NavGrantType.UNIT_LEAD, targetId: { in: actor.unitLeadOf } });
    if (or.length === 0) return [];

    const rows = await this.prisma.navPermissionGrant.findMany({
      where: { tenantId: this.tenantId, OR: or },
      select: { itemHref: true },
    });
    return Array.from(new Set(rows.map((r) => r.itemHref)));
  }

  private async getRoleTable(): Promise<Map<string, Role[]>> {
    if (this.roleTable && this.roleTable.expires > Date.now()) return this.roleTable.byHref;
    const rows = await this.prisma.navPermission.findMany({
      where: { tenantId: this.tenantId },
      select: { itemHref: true, roles: true },
    });
    const byHref = new Map(rows.map((r) => [r.itemHref, r.roles]));
    this.roleTable = { byHref, expires: Date.now() + CACHE_TTL_MS };
    return byHref;
  }

  private async getCachedGrants(actor: AuthUser): Promise<Set<string>> {
    const cached = this.grantCache.get(actor.userId);
    if (cached && cached.expires > Date.now()) return cached.hrefs;
    const hrefs = new Set(await this.getGrantedHrefsForActor(actor));
    if (this.grantCache.size >= MAX_CACHED_ACTORS) this.grantCache.clear();
    this.grantCache.set(actor.userId, { hrefs, expires: Date.now() + CACHE_TTL_MS });
    return hrefs;
  }
}
