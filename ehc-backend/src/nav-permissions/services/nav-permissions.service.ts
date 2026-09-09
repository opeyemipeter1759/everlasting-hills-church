import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { NavGrantType, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { NavPermissionItemDto } from '../dto/set-nav-permissions.dto';
import type { CreateNavGrantDto } from '../dto/nav-permission-grant.dto';

export interface NavPermissionEntry {
  itemHref: string;
  roles: Role[];
}

export interface NavPermissionGrantEntry {
  id: string;
  itemHref: string;
  type: NavGrantType;
  targetId: string;
  /** Member full name (MEMBER) or unit name (UNIT_MEMBER/UNIT_LEAD) — null if the referenced row was deleted after the grant was made. */
  name: string | null;
  photoUrl: string | null;
}

/**
 * Admin-configurable overrides of who can see/reach each sidebar nav item.
 * Deliberately a thin key-value store: it knows nothing about the actual nav
 * structure (that lives in the frontend's config.ts) — it just persists
 * `{itemHref, roles}` rows for whichever items an admin has customized. The
 * frontend merges these with each item's static default (`minRole`) to get
 * the effective rule, for both the sidebar and the route middleware.
 *
 * NavPermissionGrant is a separate, additive layer on top: named exceptions
 * ("let this one Member in", "let this Unit's leader in") that only ever
 * grant, never revoke — revoking still goes through the role table above.
 */
@Injectable()
export class NavPermissionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getAll(): Promise<NavPermissionEntry[]> {
    const rows = await this.prisma.navPermission.findMany({
      where: { tenantId: this.tenantId },
      select: { itemHref: true, roles: true },
    });
    return rows;
  }

  /**
   * Replaces the overrides for exactly the items included in `items` — an
   * item omitted from the payload is left untouched, not reset to default.
   * The frontend always sends every item it displays, so in practice this is
   * a full replace of the visible table, but the service itself doesn't
   * assume that.
   */
  async setAll(items: NavPermissionItemDto[]): Promise<NavPermissionEntry[]> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.navPermission.upsert({
          where: { tenantId_itemHref: { tenantId: this.tenantId, itemHref: item.itemHref } },
          create: { id: randomUUID(), tenantId: this.tenantId, itemHref: item.itemHref, roles: item.roles },
          update: { roles: item.roles },
        }),
      ),
    );
    return this.getAll();
  }

  /** Un-customizes one item, reverting it to its static default (`minRole` in config.ts). */
  async resetOne(itemHref: string): Promise<void> {
    await this.prisma.navPermission.deleteMany({
      where: { tenantId: this.tenantId, itemHref },
    });
  }

  /** Every named exception, with the target's display name resolved for the admin table. */
  async getAllGrants(): Promise<NavPermissionGrantEntry[]> {
    const rows = await this.prisma.navPermissionGrant.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length === 0) return [];

    const memberProfileIds = rows.filter((r) => r.type === NavGrantType.MEMBER).map((r) => r.targetId);
    const unitIds = rows.filter((r) => r.type !== NavGrantType.MEMBER).map((r) => r.targetId);

    const [members, units] = await Promise.all([
      this.prisma.member.findMany({
        where: { tenantId: this.tenantId, profileId: { in: memberProfileIds } },
        select: { profileId: true, firstName: true, lastName: true, photoUrl: true },
      }),
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId, id: { in: unitIds } },
        select: { id: true, name: true },
      }),
    ]);
    const memberByProfileId = new Map(members.map((m) => [m.profileId, m]));
    const unitById = new Map(units.map((u) => [u.id, u]));

    return rows.map((row) => {
      if (row.type === NavGrantType.MEMBER) {
        const member = memberByProfileId.get(row.targetId);
        return {
          id: row.id,
          itemHref: row.itemHref,
          type: row.type,
          targetId: row.targetId,
          name: member ? `${member.firstName} ${member.lastName}` : null,
          photoUrl: member?.photoUrl ?? null,
        };
      }
      const unit = unitById.get(row.targetId);
      return {
        id: row.id,
        itemHref: row.itemHref,
        type: row.type,
        targetId: row.targetId,
        name: unit?.name ?? null,
        photoUrl: null,
      };
    });
  }

  async addGrant(dto: CreateNavGrantDto): Promise<NavPermissionGrantEntry> {
    if (dto.type === NavGrantType.MEMBER) {
      const member = await this.prisma.member.findFirst({
        where: { tenantId: this.tenantId, profileId: dto.targetId },
        select: { profileId: true, firstName: true, lastName: true, photoUrl: true },
      });
      if (!member) throw new BadRequestException('No member found for that person');
      const row = await this.prisma.navPermissionGrant.create({
        data: { id: randomUUID(), tenantId: this.tenantId, itemHref: dto.itemHref, type: dto.type, targetId: dto.targetId },
      });
      return { id: row.id, itemHref: row.itemHref, type: row.type, targetId: row.targetId, name: `${member.firstName} ${member.lastName}`, photoUrl: member.photoUrl };
    }

    const unit = await this.prisma.unit.findFirst({
      where: { tenantId: this.tenantId, id: dto.targetId },
      select: { id: true, name: true },
    });
    if (!unit) throw new BadRequestException('No unit found for that selection');
    const row = await this.prisma.navPermissionGrant.create({
      data: { id: randomUUID(), tenantId: this.tenantId, itemHref: dto.itemHref, type: dto.type, targetId: dto.targetId },
    });
    return { id: row.id, itemHref: row.itemHref, type: row.type, targetId: row.targetId, name: unit.name, photoUrl: null };
  }

  async removeGrant(id: string): Promise<void> {
    const { count } = await this.prisma.navPermissionGrant.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (count === 0) throw new NotFoundException('Grant not found');
  }

  /**
   * The nav items this specific person can reach through a named exception,
   * independent of their role — a plain MEMBER grant on their own profileId,
   * or a UNIT_MEMBER/UNIT_LEAD grant on any unit they belong to/lead.
   * `unitLeadOf` comes straight off the already-resolved AuthUser, so no
   * extra lookup is needed for the lead case.
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
}
