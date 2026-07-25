import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { HomeCellDto } from '../dto/home-cell.dto';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';

@Injectable()
export class HomeCellFormService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async submitHomeCell(data: HomeCellDto) {
    const normalizedEmail = data.email.trim();
    const normalizedName = data.name.trim();

    const record = await this.prisma.formSubmission.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        type: 'home_cell',
        data: data as unknown as Prisma.InputJsonValue,
      },
    });

    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: `New Home Cell Registration: ${normalizedName}`,
      text: [
        `Name: ${normalizedName}`,
        `Email: ${normalizedEmail}`,
        `Phone: ${data.phone.trim()}`,
        `Address: ${data.address?.trim() ?? '—'}`,
        `Preferred Area: ${data.preferredArea?.trim() ?? '—'}`,
      ].join('\n'),
      tag: 'home-cell-admin',
    });

    this.emailDispatch.dispatch({
      to: normalizedEmail,
      subject: 'Welcome to Home Cell — Everlasting Hills Church',
      text: [
        `Dear ${normalizedName.split(/\s+/)[0]},`,
        '',
        'Thank you for registering to join a Home Cell at Everlasting Hills Church.',
        'A Cell Leader will reach out to you shortly to connect you with a group near you.',
        '',
        'God bless you,',
        'Everlasting Hills Church',
      ].join('\n'),
      tag: 'home-cell-visitor',
    });

    return {
      success: true,
      message: 'Home Cell registration submitted successfully',
      data: record,
    };
  }
}
