import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';
import type { AuthUser } from '../auth/types/auth-user';
import { meetsRole } from '../auth/guards/roles.guard';
import { parseSchema } from '../common/zod-parse.util';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import {
  type ApplicationStatus,
  applicationSchema,
  listQuerySchema,
  statusSchema,
} from './pre-marital.schema';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I: easy to read aloud

export function referenceCode(): string {
  return `PMC-${Array.from(randomBytes(6), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')}`;
}

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

const LIST_SELECT = {
  id: true,
  referenceCode: true,
  groomFirstName: true,
  groomLastName: true,
  brideFirstName: true,
  brideLastName: true,
  submittedAt: true,
  status: true,
} satisfies Prisma.PreMaritalApplicationSelect;

/**
 * Pre-marital counselling applications. Anyone may apply on the public site;
 * only pastors (and anyone given the page on the Permissions screen, which the
 * page-access guard turns into the pastor role for that request) may read them
 * or change their status. That is checked here as well as on the routes, so a
 * mis-set decorator can never open them up. Nothing here logs or notifies with
 * what a couple wrote.
 */
@Injectable()
export class PreMaritalService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Saves the application, then answers with its reference only. The form sends
   * the same submissionKey on a retry or a double click, and the unique index on
   * it means only one row is ever saved: the second request gets the first's answer.
   */
  async submit(
    raw: unknown,
  ): Promise<{ referenceCode: string; submittedAt: Date }> {
    const {
      consent: _consent,
      weddingDate,
      relationshipLength,
      message,
      ...input
    } = parseSchema(applicationSchema, raw);
    const data = {
      ...input,
      tenantId: this.tenantId,
      weddingDate: weddingDate ? new Date(`${weddingDate}T00:00:00Z`) : null,
      relationshipLength: relationshipLength ?? null,
      message: message || null,
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.preMaritalApplication.create({
          data: { ...data, id: randomUUID(), referenceCode: referenceCode() },
          select: { referenceCode: true, submittedAt: true },
        });
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const saved = await this.prisma.preMaritalApplication.findUnique({
          where: {
            tenantId_submissionKey: {
              tenantId: this.tenantId,
              submissionKey: input.submissionKey,
            },
          },
          select: { referenceCode: true, submittedAt: true },
        });
        if (saved) return saved;
        // Otherwise the reference code collided: try again with a new one.
      }
    }
    throw new ConflictException(
      'The application could not be saved. Please try again.',
    );
  }

  /** Newest first, with how many are in each status for the tabs. */
  async list(actor: AuthUser, rawQuery: unknown) {
    requirePastoral(actor);
    const { status } = parseSchema(listQuerySchema, rawQuery);
    const [items, grouped] = await Promise.all([
      this.prisma.preMaritalApplication.findMany({
        where: { tenantId: this.tenantId, ...(status ? { status } : {}) },
        orderBy: { submittedAt: 'desc' },
        take: 500,
        select: LIST_SELECT,
      }),
      this.prisma.preMaritalApplication.groupBy({
        by: ['status'],
        where: { tenantId: this.tenantId },
        _count: { _all: true },
      }),
    ]);
    const counts: Record<ApplicationStatus, number> = {
      NEW: 0,
      IN_REVIEW: 0,
      CLOSED: 0,
    };
    for (const g of grouped) counts[g.status] = g._count._all;
    return { items, counts };
  }

  /** One application in full, with who last changed its status. */
  async get(actor: AuthUser, id: string) {
    requirePastoral(actor);
    const row = await this.prisma.preMaritalApplication.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!row) throw new NotFoundException('Application not found');
    const { tenantId: _tenant, submissionKey: _key, ...application } = row;
    return {
      ...application,
      statusUpdatedByName: await this.nameOf(row.statusUpdatedById),
    };
  }

  async updateStatus(actor: AuthUser, id: string, raw: unknown) {
    requirePastoral(actor);
    const { status } = parseSchema(statusSchema, raw);
    const { count } = await this.prisma.preMaritalApplication.updateMany({
      where: { id, tenantId: this.tenantId },
      data: {
        status,
        statusUpdatedAt: new Date(),
        statusUpdatedById: actor.profileId ?? null,
      },
    });
    if (count === 0) throw new NotFoundException('Application not found');
    return this.get(actor, id);
  }

  private async nameOf(profileId: string | null): Promise<string | null> {
    if (!profileId) return null;
    const m = await this.prisma.member.findFirst({
      where: { profileId, tenantId: this.tenantId },
      select: { firstName: true, lastName: true },
    });
    return m ? `${m.firstName} ${m.lastName}`.trim() : null;
  }
}

/** The pastoral check behind the route guard: a pastor or above (Super Admin). */
export function requirePastoral(actor: AuthUser): void {
  const roles = actor.effectiveRoles?.length
    ? actor.effectiveRoles
    : actor.role
      ? [actor.role]
      : [];
  if (!meetsRole(roles, Role.PASTOR))
    throw new ForbiddenException(
      'Only the pastoral team can see pre-marital counselling applications',
    );
}
