import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { PrismaService } from '../prisma/prisma.service';
import { CaseAccess, notFound } from './case-access';
import { counsellingAudit } from './counselling-audit';
import {
  moduleCreateSchema,
  modulePatchSchema,
  reorderSchema,
} from './premarital.schema';
import { PROPOSED_MODULES } from './proposed-modules';

const PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  scriptureRefs: true,
  objectives: true,
  approvalState: true,
} as const;

/** The counselling curriculum: staff keep it, a Pastor approves each module. */
@Injectable()
export class ModulesService implements OnModuleInit {
  private readonly logger = new Logger(ModulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
  ) {}

  /** Seeds the eight proposed modules for a church that has none. Idempotent. */
  async onModuleInit() {
    try {
      await this.seedProposed();
    } catch (err) {
      this.logger.warn(
        `Could not seed the proposed counselling modules: ${(err as Error).message}`,
      );
    }
  }

  async seedProposed(): Promise<number> {
    const tenantId = this.access.tenantId;
    if (
      !(await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      }))
    )
      return 0;
    if (
      (await this.prisma.counsellingModule.count({ where: { tenantId } })) > 0
    )
      return 0;
    await this.prisma.counsellingModule.createMany({
      data: PROPOSED_MODULES.map((m, i) => ({
        id: randomUUID(),
        tenantId,
        ...m,
        sortOrder: i + 1,
      })),
    });
    return PROPOSED_MODULES.length;
  }

  /** Active modules for the public page, in order. */
  listPublic() {
    return this.prisma.counsellingModule.findMany({
      where: { tenantId: this.access.tenantId, active: true },
      orderBy: { sortOrder: 'asc' },
      select: PUBLIC_SELECT,
    });
  }

  /** Staff see every module; a counsellor sees the active ones, to mark progress. */
  async list(actor: AuthUser) {
    const tier = await this.access.requireStaffOrCounsellor(actor);
    return this.prisma.counsellingModule.findMany({
      where: {
        tenantId: this.access.tenantId,
        ...(tier === 'COUNSELLOR' ? { active: true } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(actor: AuthUser, raw: unknown) {
    this.access.requireStaff(actor, 'curriculum');
    const input = parseSchema(moduleCreateSchema, raw);
    const tenantId = this.access.tenantId;
    const last = await this.prisma.counsellingModule.aggregate({
      where: { tenantId },
      _max: { sortOrder: true },
    });
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.counsellingModule.create({
        data: {
          id: randomUUID(),
          tenantId,
          title: input.title,
          description: input.description ?? null,
          scriptureRefs: input.scriptureRefs ?? [],
          objectives: input.objectives ?? [],
          resources: (input.resources ?? []) as Prisma.InputJsonValue,
          active: input.active ?? true,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });
      await counsellingAudit(tx, {
        tenantId,
        actor,
        action: 'COUNSELLING_MODULE_CREATED',
        entity: 'CounsellingModule',
        entityId: row.id,
      });
      return row;
    });
  }

  /** Changes only the fields sent. Editing an approved module sends it back for approval. */
  async update(actor: AuthUser, id: string, raw: unknown) {
    this.access.requireStaff(actor, 'curriculum');
    const patch = parseSchema(modulePatchSchema, raw);
    const tenantId = this.access.tenantId;
    const existing = await this.prisma.counsellingModule.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw notFound();
    const { resources, ...rest } = patch;
    const content = [
      'title',
      'description',
      'scriptureRefs',
      'objectives',
      'resources',
    ].some((k) => k in patch);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.counsellingModule.update({
        where: { id },
        data: {
          ...rest,
          ...(resources !== undefined
            ? { resources: resources as Prisma.InputJsonValue }
            : {}),
          ...(content && existing.approvalState === 'APPROVED'
            ? {
                approvalState: 'PROPOSED' as const,
                approvedById: null,
                approvedAt: null,
              }
            : {}),
        },
      });
      await counsellingAudit(tx, {
        tenantId,
        actor,
        action: 'COUNSELLING_MODULE_UPDATED',
        entity: 'CounsellingModule',
        entityId: id,
      });
      return row;
    });
  }

  /** Puts the modules in the order given; every module must be listed once. */
  async reorder(actor: AuthUser, raw: unknown) {
    this.access.requireStaff(actor, 'curriculum');
    const { ids } = parseSchema(reorderSchema, raw);
    const tenantId = this.access.tenantId;
    const all = await this.prisma.counsellingModule.findMany({
      where: { tenantId },
      select: { id: true },
    });
    const known = new Set(all.map((m) => m.id));
    if (
      ids.length !== known.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !known.has(id))
    ) {
      throw new BadRequestException('List every module exactly once');
    }
    await this.prisma.$transaction(async (tx) => {
      for (const [i, id] of ids.entries())
        await tx.counsellingModule.update({
          where: { id },
          data: { sortOrder: i + 1 },
        });
      await counsellingAudit(tx, {
        tenantId,
        actor,
        action: 'COUNSELLING_MODULES_REORDERED',
        entity: 'CounsellingModule',
        entityId: tenantId,
      });
    });
    return this.list(actor);
  }

  async approve(actor: AuthUser, id: string) {
    this.access.requireStaff(actor, 'approveModule');
    const tenantId = this.access.tenantId;
    const { count } = await this.prisma.counsellingModule.updateMany({
      where: { id, tenantId },
      data: {
        approvalState: 'APPROVED',
        approvedById: actor.profileId ?? null,
        approvedAt: new Date(),
      },
    });
    if (count === 0) throw notFound();
    await counsellingAudit(this.prisma, {
      tenantId,
      actor,
      action: 'COUNSELLING_MODULE_APPROVED',
      entity: 'CounsellingModule',
      entityId: id,
    });
    return this.prisma.counsellingModule.findUniqueOrThrow({ where: { id } });
  }
}
