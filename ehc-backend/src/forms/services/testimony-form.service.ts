import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { TestimonyDto } from '../dto/testimony.dto';
import { buildTestimonyAdminText, buildTestimonyVisitorText } from '../forms-text-templates.util';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';

@Injectable()
export class TestimonyFormService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** memberId is populated only when the submitter is signed in (optional auth
   * on this public route) — kept even when is_anonymous, so admins can always
   * see who a signed-in member really is; anonymous only hides the free-text name. */
  async submitTestimony(data: TestimonyDto, memberId: string | null = null) {
    const normalizedEmail = data.email?.trim();
    const normalizedName = data.name?.trim();
    const normalizedPhone = data.phone?.trim();
    const normalizedTitle = data.title?.trim();

    const contact = [normalizedEmail, normalizedPhone].filter(Boolean).join(' · ');
    const content = normalizedTitle
      ? `${normalizedTitle}\n\n${data.testimony.trim()}`
      : data.testimony.trim();

    // Land it directly in the Testimonial table (unpublished) so it shows up as a draft on
    // the pastor's testimonials CMS page, ready for review/publish — not just a write-only
    // FormSubmission log no admin UI ever reads.
    // Contact info goes in submitterContact (admin-only, for pastoral follow-up) — never
    // authorRole, which is the public-facing byline shown on the live homepage.
    const [record] = await Promise.all([
      this.prisma.testimonial.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          authorName: data.is_anonymous ? 'Anonymous' : normalizedName || 'Anonymous',
          authorRole: null,
          submitterContact: contact || null,
          content,
          isAnonymous: data.is_anonymous ?? false,
          sharePhysically: data.share_physically ?? null,
          memberId,
          published: false,
          order: 0,
          updatedAt: new Date(),
        },
      }),
      this.prisma.formSubmission.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          type: 'testimony',
          data: data as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: `New Testimony${normalizedName ? ` from ${normalizedName}` : ''}`,
      text: buildTestimonyAdminText(data),
      tag: 'testimony-admin',
    });
    if (normalizedEmail) {
      this.emailDispatch.dispatch({
        to: normalizedEmail,
        subject: 'Thank you for your testimony',
        text: buildTestimonyVisitorText(data),
        tag: 'testimony-visitor',
      });
    }

    return {
      success: true,
      message: 'Testimony submitted successfully',
      data: record,
    };
  }
}
