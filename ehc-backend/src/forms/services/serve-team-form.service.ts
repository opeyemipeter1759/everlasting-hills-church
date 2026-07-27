import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { ServeTeamDto } from '../dto/serve-team.dto';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';

@Injectable()
export class ServeTeamFormService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async submitServeTeam(data: ServeTeamDto) {
    const normalizedEmail = data.email.trim();
    const normalizedName = data.name.trim();

    const record = await this.prisma.formSubmission.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        type: 'serve_team',
        data: data as unknown as Prisma.InputJsonValue,
      },
    });

    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: `New Serve Team Interest: ${normalizedName} → ${data.unit}`,
      text: [
        `Name: ${normalizedName}`,
        `Email: ${normalizedEmail}`,
        `Phone: ${data.phone?.trim() ?? '—'}`,
        `Team: ${data.unit}`,
        '',
        `Message: ${data.message?.trim() ?? '—'}`,
      ].join('\n'),
      tag: 'serve-team-admin',
    });

    this.emailDispatch.dispatch({
      to: normalizedEmail,
      subject: 'Your serve team interest — Everlasting Hills Church',
      text: [
        `Dear ${normalizedName.split(/\s+/)[0]},`,
        '',
        `Thank you for expressing interest in joining the ${data.unit} at Everlasting Hills Church.`,
        'Our team will be in touch with you soon.',
        '',
        'God bless you,',
        'Everlasting Hills Church',
      ].join('\n'),
      tag: 'serve-team-visitor',
    });

    return {
      success: true,
      message: 'Serve team interest submitted successfully',
      data: record,
    };
  }
}
