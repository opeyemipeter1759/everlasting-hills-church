import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../../inbox/inbox.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { MANAGE_ROLES, parseSchema } from '../departments.util';
import { DeptAnnouncementSchema, NudgeSchema } from '../dto/department.schema';
import { DepartmentsSharedService } from './departments-shared.service';
import { DepartmentsScopeService } from './departments-scope.service';

/** Department-scoped announcements and unit-lead nudges. */
@Injectable()
export class DepartmentsEngagementService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    private readonly shared: DepartmentsSharedService,
    private readonly scope: DepartmentsScopeService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async postDeptAnnouncement(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = parseSchema(DeptAnnouncementSchema, raw);
    const dept = await this.shared.deptOrThrow(deptId);
    await this.scope.assertCanTargetDept(actor, deptId);

    // Recipients = distinct member profiles in this department's units.
    const rows = await this.prisma.unitMember.findMany({
      where: { tenantId: this.tenantId, Unit: { departmentId: deptId } },
      select: { Member: { select: { profileId: true } } },
    });
    const profileIds = [...new Set(rows.map((r) => r.Member.profileId))];

    const delivered = await this.inbox.createMany(
      profileIds.map((profileId) => ({
        tenantId: this.tenantId,
        profileId,
        title: dto.title,
        body: dto.body,
        type: 'announcement',
        link: '/dashboard',
      })),
    );

    await this.prisma.announcement.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: dto.title,
        body: dto.body,
        audience: `dept:${dept.code}`,
        sendEmail: false,
        createdById: actor.userId,
        recipients: delivered,
      },
    });

    await this.shared.writeAudit({ action: 'ANNOUNCE', entity: 'Department', entityId: deptId, actorId: actor.userId, after: { title: dto.title, recipients: delivered } });
    return { departmentId: deptId, recipients: delivered };
  }

  async nudgeLead(actor: AuthUser, unitId: string, raw: unknown) {
    const dto = parseSchema(NudgeSchema, raw);
    const unitIds = await this.scope.myUnitIds(actor);
    const isManager = actor.role && MANAGE_ROLES.includes(actor.role);
    if (!isManager && !unitIds.has(unitId)) {
      throw new ForbiddenException('This unit is not in your department');
    }
    const lead = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, unitId, OR: [{ isLead: true }, { isAssistant: true }] },
      orderBy: { isLead: 'desc' },
      include: { Member: { select: { profileId: true, firstName: true } }, Unit: { select: { name: true } } },
    });
    if (!lead) return { notified: 0, message: 'This unit has no lead to nudge' };

    const delivered = await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: lead.Member.profileId,
        title: `Reminder for ${lead.Unit.name}`,
        body: dto.message?.trim() || `A reminder from your department head regarding ${lead.Unit.name}.`,
        type: 'nudge',
        link: '/dashboard/unit-lead',
      },
    ]);
    await this.shared.writeAudit({ action: 'NUDGE', entity: 'Unit', entityId: unitId, actorId: actor.userId, after: { leadProfileId: lead.Member.profileId } });
    return { notified: delivered };
  }
}
