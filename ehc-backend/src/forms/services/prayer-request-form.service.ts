import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { PrayerRequestDto } from '../dto/prayer-request.dto';
import { buildPrayerAdminText, buildPrayerVisitorText } from '../forms-text-templates.util';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';
import { PrayerTriageService } from './prayer-triage.service';

@Injectable()
export class PrayerRequestFormService {
  private readonly logger = new Logger(PrayerRequestFormService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    private readonly triage: PrayerTriageService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** memberId is populated only when the submitter is signed in (optional auth
   * on this public route) — kept even when is_anonymous, so admins can always
   * see who a signed-in member really is; anonymous only hides the free-text name. */
  async submitPrayerRequest(data: PrayerRequestDto, memberId: string | null = null) {
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = data.phone?.trim();
    const displayName = data.is_anonymous ? 'Anonymous' : data.name?.trim() || 'Anonymous';

    const record = await this.prisma.prayerRequest.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        request: data.request.trim(),
        name: data.name ? data.name.trim() : null,
        email: normalizedEmail ?? null,
        phone: normalizedPhone ?? null,
        isAnonymous: data.is_anonymous ?? false,
        memberId,
      },
    });

    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: `New Prayer Request from ${displayName}`,
      text: buildPrayerAdminText(data),
      tag: 'prayer-admin',
    });
    if (normalizedEmail) {
      this.emailDispatch.dispatch({
        to: normalizedEmail,
        subject: 'We received your prayer request',
        text: buildPrayerVisitorText(data),
        tag: 'prayer-visitor',
      });
    }

    // Fire-and-forget — never blocks or fails the submission response.
    this.triage.triageAndSave(record.id, record.request, record.isAnonymous).catch((err) => {
      this.logger.warn(`Triage dispatch failed for ${record.id}: ${(err as Error).message}`);
    });

    return {
      success: true,
      message: 'Prayer request submitted successfully',
      data: record,
    };
  }

  /** Admin list, newest first. The linked member (if the submitter was signed
   * in) is always included regardless of isAnonymous — see submitPrayerRequest. */
  async listPrayerRequests() {
    const rows = await this.prisma.prayerRequest.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { submittedAt: 'desc' },
      include: {
        Member: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
        },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      request: r.request,
      name: r.name,
      email: r.email,
      phone: r.phone,
      isAnonymous: r.isAnonymous,
      submittedAt: r.submittedAt.toISOString(),
      status: r.status,
      member: r.Member,
      aiCategory: r.aiCategory,
      aiUrgency: r.aiUrgency,
      aiRouteTo: r.aiRouteTo,
      aiSummary: r.aiSummary,
      aiTriagedAt: r.aiTriagedAt?.toISOString() ?? null,
    }));
  }

  async deletePrayerRequest(id: string) {
    const result = await this.prisma.prayerRequest.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Prayer request not found');
    return { id, deleted: true };
  }

  async updatePrayerRequestStatus(id: string, status: 'PENDING' | 'PRAYED') {
    const result = await this.prisma.prayerRequest.updateMany({
      where: { id, tenantId: this.tenantId },
      data: { status },
    });
    if (result.count === 0) throw new NotFoundException('Prayer request not found');
    return { id, status };
  }
}
