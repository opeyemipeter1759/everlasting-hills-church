import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEvents } from '../notifications/notification-events';
import type { Env } from '../config/env.validation';

@Injectable()
export class HomeCellService {
  private readonly tenantId: string;
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.adminEmail =
      (config.get('RESEND_ADMIN_EMAIL', { infer: true }) as string | undefined) ??
      (config.get('CONTACT_EMAIL', { infer: true }) as string | undefined) ??
      'hello@everlastinghills.org';
  }

  async getStates() {
    const rows = await this.prisma.homeCell.findMany({
      where: { tenantId: this.tenantId, isActive: true },
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    });
    return rows.map((r) => r.state);
  }

  async getCities(state: string) {
    const rows = await this.prisma.homeCell.findMany({
      where: { tenantId: this.tenantId, isActive: true, state },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return rows.map((r) => r.city);
  }

  async search(state?: string, city?: string) {
    const where: Prisma.HomeCellWhereInput = {
      tenantId: this.tenantId,
      isActive: true,
      ...(state ? { state } : {}),
      ...(city ? { city } : {}),
    };
    return this.prisma.homeCell.findMany({
      where,
      orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const cell = await this.prisma.homeCell.findUnique({ where: { id } });
    if (!cell || cell.tenantId !== this.tenantId) throw new NotFoundException('Cell not found');
    return cell;
  }

  async create(data: {
    name: string;
    leaderName: string;
    leaderPhone: string;
    meetingDay: string;
    meetingTime: string;
    address: string;
    city?: string;
    state?: string;
  }) {
    return this.prisma.homeCell.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: data.name,
        leaderName: data.leaderName,
        leaderPhone: data.leaderPhone,
        meetingDay: data.meetingDay,
        meetingTime: data.meetingTime,
        address: data.address,
        city: data.city ?? 'Ibadan',
        state: data.state ?? 'Oyo',
        isActive: true,
      },
    });
  }

  async join(id: string, data: { name: string; phone: string; email?: string; preferredTime?: string; prayerRequest?: string }) {
    const cell = await this.findOne(id);

    const record = await this.prisma.formSubmission.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        type: 'home_cell_join',
        data: { ...data, cellId: id, cellName: cell.name } as unknown as Prisma.InputJsonValue,
      },
    });

    this.events.emit(NotificationEvents.SendEmail, {
      to: this.adminEmail,
      subject: `New Home Cell Join Request: ${data.name} → ${cell.name}`,
      text: [
        `Cell: ${cell.name}`,
        `Leader: ${cell.leaderName}`,
        '',
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email ?? '—'}`,
        `Preferred Time: ${data.preferredTime ?? '—'}`,
        `Prayer Request: ${data.prayerRequest ?? '—'}`,
      ].join('\n'),
      tag: 'home-cell-join-admin',
    });

    if (data.email) {
      this.events.emit(NotificationEvents.SendEmail, {
        to: data.email,
        subject: `Your Home Cell request — Everlasting Hills Church`,
        text: [
          `Dear ${data.name.split(/\s+/)[0]},`,
          '',
          `Thank you for requesting to join the ${cell.name} Home Cell.`,
          `The Cell Leader, ${cell.leaderName}, will reach out to you soon.`,
          '',
          'God bless you,',
          'Everlasting Hills Church',
        ].join('\n'),
        tag: 'home-cell-join-visitor',
      });
    }

    return { success: true, message: 'Request submitted', data: record };
  }
}
