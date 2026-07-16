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

  private buildCellData(
    data: {
      name: string; leaderName?: string; leaderPhone: string;
      meetingDay: string; meetingTime: string; address: string;
      city?: string; state?: string;
    },
    isActive: boolean,
  ) {
    return {
      id: randomUUID(),
      tenantId: this.tenantId,
      name: data.name,
      leaderName: data.leaderName ?? '',
      leaderPhone: data.leaderPhone,
      meetingDay: data.meetingDay,
      meetingTime: data.meetingTime,
      address: data.address,
      city: data.city ?? 'Ibadan',
      state: data.state ?? 'Oyo',
      isActive,
    };
  }

  /** Public submission — goes to pending (isActive: false) until admin approves */
  async create(data: {
    name: string; leaderName?: string; leaderPhone: string;
    meetingDay: string; meetingTime: string; address: string;
    city?: string; state?: string;
  }) {
    return this.prisma.homeCell.create({ data: this.buildCellData(data, false) });
  }

  /** Admin direct creation — immediately active */
  async createByAdmin(data: {
    name: string; leaderName?: string; leaderPhone: string;
    meetingDay: string; meetingTime: string; address: string;
    city?: string; state?: string;
  }) {
    return this.prisma.homeCell.create({ data: this.buildCellData(data, true) });
  }

  /** Admin list — all cells including pending */
  async findAllAdmin() {
    return this.prisma.homeCell.findMany({
      where: { tenantId: this.tenantId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async approve(id: string) {
    const cell = await this.findOne(id);
    return this.prisma.homeCell.update({ where: { id: cell.id }, data: { isActive: true } });
  }

  async remove(id: string) {
    const cell = await this.findOne(id);
    return this.prisma.homeCell.delete({ where: { id: cell.id } });
  }

  async join(id: string, data: { name: string; phone: string; email: string }) {
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
        `Meeting: ${cell.meetingDay}s at ${cell.meetingTime}`,
        `Location: ${cell.address}, ${cell.city}, ${cell.state}`,
        `Contact: ${cell.leaderPhone ?? '—'}`,
        '',
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email ?? '—'}`,
      ].join('\n'),
      tag: 'home-cell-join-admin',
    });

    this.events.emit(NotificationEvents.SendEmail, {
      to: data.email,
      subject: `Welcome to ${cell.name} — You're now part of something special`,
      text: [
        `Hi ${data.name.split(/\s+/)[0]},`,
        '',
        `We're so glad you're here.`,
        '',
        `You've just taken a step that many people wish they had taken sooner — and we believe it's going to make a real difference in your life. The ${cell.name} Home Cell is a warm, welcoming community of believers, and they're expecting you.`,
        '',
        `Here's everything you need to show up:`,
        '',
        `  📍 Location   ${cell.address}, ${cell.city}, ${cell.state}`,
        `  📞 Contact    ${cell.leaderPhone ?? 'The cell leader will reach out to you soon'}`,
        `  🗓  Meets      Every ${cell.meetingDay} at ${cell.meetingTime}`,
        '',
        `Feel free to reach out to the cell contact above if you have any questions before your first visit. There's no dress code, no pressure — just come as you are.`,
        '',
        `We'll be praying for you this week.`,
        '',
        `With love,`,
        `Everlasting Hills Church`,
      ].join('\n'),
      tag: 'home-cell-join-visitor',
    });

    return { success: true, message: 'Request submitted', data: record };
  }
}
