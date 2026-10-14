import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { WelfareRequestDto } from '../dto/welfare-request.dto';
import { buildWelfareAdminText, buildWelfareVisitorText } from '../forms-text-templates.util';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easy to read aloud

function generateReferenceCode(): string {
  const bytes = randomBytes(6);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `WLF-${chars.join('')}`;
}

@Injectable()
export class WelfareRequestFormService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** memberId is populated only when the submitter is signed in (optional auth
   * on this public route) — same semantics as PrayerRequest. */
  async submitWelfareRequest(data: WelfareRequestDto, memberId: string | null = null) {
    const referenceCode = generateReferenceCode();

    const record = await this.prisma.welfareRequest.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        referenceCode,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        isWorkerInChurch: data.isWorkerInChurch,
        address: data.address.trim(),
        attendanceLength: data.attendanceLength.trim(),
        occupation: data.occupation.trim(),
        category: data.category.trim(),
        description: data.description.trim(),
        urgency: data.urgency,
        memberId,
      },
    });

    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: `New Welfare Request — ${referenceCode}`,
      text: buildWelfareAdminText(data, referenceCode),
      tag: 'welfare-admin',
    });
    this.emailDispatch.dispatch({
      to: record.email,
      subject: `We received your request — ${referenceCode}`,
      text: buildWelfareVisitorText(data, referenceCode),
      tag: 'welfare-visitor',
    });

    return {
      success: true,
      message: 'Welfare request submitted successfully',
      referenceCode,
      data: record,
    };
  }

  /** Admin list, newest first. */
  async listWelfareRequests() {
    const rows = await this.prisma.welfareRequest.findMany({
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
      referenceCode: r.referenceCode,
      fullName: r.fullName,
      phone: r.phone,
      email: r.email,
      isWorkerInChurch: r.isWorkerInChurch,
      address: r.address,
      attendanceLength: r.attendanceLength,
      occupation: r.occupation,
      category: r.category,
      description: r.description,
      urgency: r.urgency,
      status: r.status,
      submittedAt: r.submittedAt.toISOString(),
      member: r.Member,
    }));
  }

  async deleteWelfareRequest(id: string) {
    const result = await this.prisma.welfareRequest.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Welfare request not found');
    return { id, deleted: true };
  }

  async updateWelfareRequestStatus(id: string, status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DECLINED') {
    const result = await this.prisma.welfareRequest.updateMany({
      where: { id, tenantId: this.tenantId },
      data: { status },
    });
    if (result.count === 0) throw new NotFoundException('Welfare request not found');
    return { id, status };
  }
}
