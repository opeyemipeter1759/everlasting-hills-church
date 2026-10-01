import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { FastingRules } from './fasting-day.util';

export interface ActiveFast {
  eventSlug: string;
  eventTitle: string;
  theme: string | null;
  /** Attached to every email. */
  imageUrl: string | null;
  liveUrl: string | null;
  rules: FastingRules;
}

/**
 * The fast running on a date: a published event with a visible Fasting
 * Schedule section whose dates cover it. Driven by the section rather than a
 * fixed date range, so editing the event changes the emails too, and they stop
 * by themselves when the fast ends.
 */
@Injectable()
export class ActiveFastService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async on(date: string): Promise<ActiveFast | null> {
    const sections = await this.prisma.eventSection.findMany({
      where: { tenantId: this.tenantId, type: 'FASTING_SCHEDULE', isVisible: true, Event: { status: 'PUBLISHED' } },
      select: {
        content: true,
        Event: { select: { slug: true, title: true, theme: true, flyerImageUrl: true, coverImageUrl: true, liveUrl: true } },
      },
    });
    for (const s of sections) {
      const rules = s.content as unknown as FastingRules;
      if (!rules?.startDate || !rules.endDate) continue;
      if (date >= rules.startDate && date <= rules.endDate) {
        return {
          eventSlug: s.Event.slug,
          eventTitle: s.Event.title,
          theme: s.Event.theme,
          imageUrl: s.Event.flyerImageUrl ?? s.Event.coverImageUrl,
          liveUrl: s.Event.liveUrl,
          rules: {
            ...rules,
            dryFasts: rules.dryFasts ?? [],
            noMorningDays: rules.noMorningDays ?? [],
            noEveningDays: rules.noEveningDays ?? [],
            serviceDays: rules.serviceDays ?? [],
          },
        };
      }
    }
    return null;
  }

  get tenant(): string {
    return this.tenantId;
  }
}
