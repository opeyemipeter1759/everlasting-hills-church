import { Injectable } from '@nestjs/common';
import { AnnouncementsService } from '../../announcements/announcements.service';
import { ReadingPlanCatalogueService } from './reading-plan-catalogue.service';
import type { ShareReadingPlanDto } from '../dto/share-reading-plan.dto';

/**
 * An admin sharing a plan with the whole church.
 *
 * The plan is looked up through the catalogue, so only a published plan this
 * church can see can be shared, and the notification always opens a plan a
 * member is able to start. The fan-out itself is an announcement.
 */
@Injectable()
export class ReadingPlanShareService {
  constructor(
    private readonly catalogue: ReadingPlanCatalogueService,
    private readonly announcements: AnnouncementsService,
  ) {}

  async shareWithChurch(planId: string, dto: ShareReadingPlanDto, sharedById: string | null) {
    const plan = await this.catalogue.detail(planId);
    const { id, recipients } = await this.announcements.announceReadingPlan({
      plan: { title: plan.title, subtitle: plan.subtitle, slug: plan.slug },
      note: dto.note,
      sendEmail: dto.sendEmail ?? false,
      sharedById,
    });
    return { announcementId: id, recipients };
  }
}
