import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import type { CreateAssignmentDto } from './dto/create-assignment.dto';

/**
 * Care / discipleship assignments: link members to a leader (also a member) for
 * follow-up. Backs the "Assign Members" flow in the People console.
 */
@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Assign members[] to leaderId. Idempotent per (member, leader); skips self-links. */
  async assign(actor: AuthUser, dto: CreateAssignmentDto) {
    const leader = await this.prisma.member.findFirst({
      where: { id: dto.leaderId, tenantId: this.tenantId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!leader) throw new NotFoundException('Leader not found');

    const memberIds = [...new Set(dto.memberIds)].filter((id) => id !== dto.leaderId);
    if (memberIds.length === 0) {
      throw new BadRequestException('No assignable members (cannot assign a leader to themselves)');
    }

    // Only assign members that actually exist in this tenant.
    const valid = await this.prisma.member.findMany({
      where: { id: { in: memberIds }, tenantId: this.tenantId },
      select: { id: true },
    });

    let created = 0;
    for (const m of valid) {
      const existing = await this.prisma.careAssignment.findUnique({
        where: {
          tenantId_memberId_leaderId: {
            tenantId: this.tenantId,
            memberId: m.id,
            leaderId: dto.leaderId,
          },
        },
        select: { id: true },
      });
      if (existing) continue;
      await this.prisma.careAssignment.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          memberId: m.id,
          leaderId: dto.leaderId,
          assignedById: actor.userId,
          note: dto.note?.trim() || null,
        },
      });
      created += 1;
    }

    this.logger.log(
      `[${actor.email}] assigned ${created} member(s) to ${leader.firstName} ${leader.lastName}`,
    );
    return { assigned: created, skipped: valid.length - created, leaderId: dto.leaderId };
  }

  /** List assignments, optionally filtered by leader or member. */
  async list(opts: { leaderId?: string; memberId?: string }) {
    const rows = await this.prisma.careAssignment.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.leaderId ? { leaderId: opts.leaderId } : {}),
        ...(opts.memberId ? { memberId: opts.memberId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        Leader: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
      member: {
        id: r.Member.id,
        name: `${r.Member.firstName} ${r.Member.lastName}`.trim(),
        photoUrl: r.Member.photoUrl,
      },
      leader: {
        id: r.Leader.id,
        name: `${r.Leader.firstName} ${r.Leader.lastName}`.trim(),
        photoUrl: r.Leader.photoUrl,
      },
    }));
  }

  async remove(id: string) {
    const existing = await this.prisma.careAssignment.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Assignment not found');
    await this.prisma.careAssignment.delete({ where: { id } });
    return { success: true, id };
  }
}
