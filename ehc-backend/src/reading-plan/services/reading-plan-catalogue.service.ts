import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanStatus, ReadingTrack } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { readingIntensity, type ReadingIntensity } from '../reading-intensity';

/**
 * The public half of the reading plan API: plans, days and portions.
 *
 * Everything here is immutable content. A published plan cannot change, which
 * is enforced by database triggers as well as by this layer, so these responses
 * carry long cache headers and never touch a member's progress. Mixing the two
 * on one endpoint would let a private field poison a shared cache.
 */
@Injectable()
export class ReadingPlanCatalogueService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Published plans available to this church: the global templates plus
   * anything the church has forked for itself.
   */
  async list(track?: ReadingTrack, intensity?: ReadingIntensity) {
    const plans = await this.prisma.readingPlan.findMany({
      where: {
        status: PlanStatus.PUBLISHED,
        OR: [{ tenantId: null }, { tenantId: this.tenantId }],
        ...(track ? { track } : {}),
      },
      orderBy: [{ durationDays: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        track: true,
        durationDays: true,
        avgMinutesPerDay: true,
        coverImageUrl: true,
        version: true,
        tenantId: true,
      },
    });

    // A church's own fork replaces the template it came from, so a member is
    // never offered both.
    const forkedSlugs = new Set(plans.filter((p) => p.tenantId).map((p) => p.slug));
    const available = plans.filter((plan) => plan.tenantId !== null || !forkedSlugs.has(plan.slug));
    // Old versions remain accessible by ID for existing subscribers, but new
    // readers should choose the newest published version of each plan only.
    const latest = new Map<string, (typeof available)[number]>();
    for (const plan of available) {
      if (!latest.has(plan.slug) || latest.get(plan.slug)!.version < plan.version) {
        latest.set(plan.slug, plan);
      }
    }
    return available
      .filter((plan) => latest.get(plan.slug)?.id === plan.id)
      .map(({ tenantId, ...plan }) => ({ ...plan, intensity: readingIntensity(plan.avgMinutesPerDay) }))
      .filter((plan) => !intensity || plan.intensity === intensity);
  }

  async detail(planId: string) {
    const plan = await this.prisma.readingPlan.findFirst({
      where: {
        id: planId,
        status: PlanStatus.PUBLISHED,
        OR: [{ tenantId: null }, { tenantId: this.tenantId }],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        track: true,
        durationDays: true,
        avgMinutesPerDay: true,
        coverImageUrl: true,
        version: true,
      },
    });
    if (!plan) throw new NotFoundException('Reading plan not found');
    return { ...plan, intensity: readingIntensity(plan.avgMinutesPerDay) };
  }

  /** A page of the day list, for browsing a plan before subscribing. */
  async days(planId: string, page = 1, limit = 30) {
    await this.detail(planId);
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [days, total] = await Promise.all([
      this.prisma.readingPlanDay.findMany({
        where: { planId },
        orderBy: { dayIndex: 'asc' },
        skip,
        take,
        select: {
          dayIndex: true,
          title: true,
          referenceLabel: true,
          estimatedMinutes: true,
          totalWordCount: true,
        },
      }),
      this.prisma.readingPlanDay.count({ where: { planId } }),
    ]);

    return { days, meta: { page: Math.max(page, 1), limit: take, total } };
  }

  /** One day with its portions. References only, never scripture text. */
  async day(planId: string, dayIndex: number) {
    await this.detail(planId);
    const day = await this.prisma.readingPlanDay.findFirst({
      where: { planId, dayIndex },
      select: {
        dayIndex: true,
        title: true,
        referenceLabel: true,
        reflectionPrompt: true,
        estimatedMinutes: true,
        totalWordCount: true,
        Portions: {
          orderBy: { sequence: 'asc' },
          select: {
            sequence: true,
            label: true,
            startVerseId: true,
            endVerseId: true,
            isOptional: true,
            wordCount: true,
          },
        },
      },
    });
    if (!day) throw new NotFoundException(`This plan has no day ${dayIndex}`);
    return day;
  }
}
