import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import { pipelineCte, pipelineOrder, pipelineWhere } from '../pipeline/pipeline.sql';
import { lagosDate } from './email-budget.service';
import { MessageTemplatesService } from './message-templates.service';
import { OpeningMessageService } from './opening-message.service';
import { canEmailOpening, requireOpeningSender } from './opening-access';
import { OPENING_KEY } from './template-variables';

/**
 * How far back the queue looks. People who first came longer ago than this and
 * were never contacted are from before contact logging began, or were missed
 * for good; an "opening" message weeks later would read oddly.
 */
export const QUEUE_WINDOW_DAYS = 60;
const QUEUE_MAX = 200;

/**
 * The list the first-timer contact works through after each Sunday: everyone
 * still being followed up (not integrated, not opted out) whom nobody has
 * contacted yet, oldest first. Reads the pipeline's own query, so a person
 * leaves the queue the moment any contact is logged, from any screen.
 */
@Injectable()
export class OpeningQueueService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: PipelineRepository,
    private readonly templates: MessageTemplatesService,
    private readonly opening: OpeningMessageService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Visitor ids in the queue, in queue order. */
  async queueIds(now = new Date()): Promise<string[]> {
    const since = lagosDate(new Date(now.getTime() - QUEUE_WINDOW_DAYS * 24 * 60 * 60 * 1000));
    const rows = await this.prisma.$queryRaw<{ visitorId: string }[]>(Prisma.sql`
      WITH ${pipelineCte(this.tenantId)}
      SELECT pl."visitorId" FROM pipeline pl
       WHERE ${pipelineWhere({ notContacted: true })}
         AND pl.status IN ('FIRST_TIMER', 'SECOND_TIMER', 'THIRD_TIMER')
         AND pl."firstVisitDate" >= ${since}::date
       ORDER BY ${pipelineOrder('oldest')}, pl."visitorId"
       LIMIT ${QUEUE_MAX}`);
    return rows.map((r) => r.visitorId);
  }

/**
   * Every first-timer ever, newest first, any status, each with a ready
   * WhatsApp link: the Guest Care Coordinator can reach anyone, not only the
   * people still waiting for their opening message.
   */
  async everyone(actor: AuthUser, q: { search?: string; take?: number; skip?: number }) {
    requireOpeningSender(actor);
    const page = await this.pipeline.list({ search: q.search || undefined, sort: 'newest', take: Math.min(q.take ?? 25, 100), skip: q.skip ?? 0 });
    const active = await this.templates.active(OPENING_KEY);
    const sender = active ? await this.opening.sender(actor) : null;
    const lastSent = await this.lastWhatsApp(page.rows.map((r) => r.visitorId));
    return {
      template: active ? { key: OPENING_KEY, version: active.version } : null,
      total: page.total,
      rows: page.rows.map((person) => ({
        person,
        whatsapp: active && sender ? this.opening.whatsappFor(person, active, sender) : null,
        lastWhatsApp: lastSent.get(person.visitorId) ?? null,
      })),
    };
  }

  /** The latest WhatsApp send to each of these people: when, and who sent it. */
  private async lastWhatsApp(visitorIds: string[]): Promise<Map<string, { sentAt: string; sentByName: string | null }>> {
    if (visitorIds.length === 0) return new Map();
    const logs = await this.prisma.messageLog.findMany({
      where: { tenantId: this.tenantId, visitorId: { in: visitorIds }, channel: 'whatsapp', status: 'SENT' },
      orderBy: { sentAt: 'desc' },
      select: { visitorId: true, sentAt: true, sentById: true },
    });
    const senderIds = [...new Set(logs.map((l) => l.sentById).filter((id): id is string => !!id))];
    const members = senderIds.length
      ? await this.prisma.member.findMany({ where: { tenantId: this.tenantId, profileId: { in: senderIds } }, select: { profileId: true, firstName: true, lastName: true } })
      : [];
    const names = new Map(members.map((m) => [m.profileId, `${m.firstName} ${m.lastName}`.trim()]));
    const latest = new Map<string, { sentAt: string; sentByName: string | null }>();
    for (const l of logs) {
      if (!latest.has(l.visitorId)) latest.set(l.visitorId, { sentAt: l.sentAt.toISOString(), sentByName: l.sentById ? (names.get(l.sentById) ?? null) : null });
    }
    return latest;
  }

  async queue(actor: AuthUser) {
    requireOpeningSender(actor);
    const ids = await this.queueIds();
    const page = await this.pipeline.list({ visitorIds: ids, sort: 'oldest', take: QUEUE_MAX });
    const active = await this.templates.active(OPENING_KEY);
    const sender = active ? await this.opening.sender(actor) : null;
    return {
      windowDays: QUEUE_WINDOW_DAYS,
      canEmail: canEmailOpening(actor),
      template: active ? { key: OPENING_KEY, version: active.version } : null,
      total: page.total,
      rows: page.rows.map((person) => ({
        person,
        whatsapp: active && sender ? this.opening.whatsappFor(person, active, sender) : null,
      })),
    };
  }
}
