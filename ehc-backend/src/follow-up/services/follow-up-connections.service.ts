import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpConnectionStatus, FollowUpLogKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { ENTRY_INCLUDE } from '../follow-up.types';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpConnectionMatchService } from './follow-up-connection-match.service';

/** Suggested-friend workflow: refresh suggestions on read, let a worker/leader
 * introduce one (writes to the same unified timeline), then record the outcome. */
@Injectable()
export class FollowUpConnectionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly mapper: FollowUpEntryMapperService,
    private readonly matcher: FollowUpConnectionMatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async loadEntry(id: string) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId }, include: ENTRY_INCLUDE });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    return entry;
  }

  async list(actor: AuthUser, entryId: string) {
    await this.matcher.refreshSuggestions(entryId);
    const entry = await this.loadEntry(entryId);
    return this.mapper.mapEntry(entry, actor).connections;
  }

  async introduce(actor: AuthUser, entryId: string, connectionId: string) {
    const entry = await this.loadEntry(entryId);
    if (!actor.memberId || !this.auth.canWork(actor, entry)) {
      throw new ForbiddenException('You are not assigned to this follow-up');
    }
    const connection = entry.Connections.find((c) => c.id === connectionId);
    if (!connection) throw new NotFoundException('Suggested connection not found');
    if (connection.status !== FollowUpConnectionStatus.SUGGESTED) {
      throw new BadRequestException('This connection has already been acted on');
    }

    await this.prisma.$transaction([
      this.prisma.followUpConnection.update({
        where: { id: connectionId },
        data: { status: FollowUpConnectionStatus.INTRODUCED, introducedById: actor.memberId, introducedAt: new Date() },
      }),
      this.prisma.followUpContactLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          entryId,
          byId: actor.memberId,
          kind: FollowUpLogKind.CONNECTION,
          note: `Introduced to ${connection.SuggestedMember.firstName} ${connection.SuggestedMember.lastName}`.trim(),
        },
      }),
    ]);

    const updated = await this.loadEntry(entryId);
    return this.mapper.mapEntry(updated, actor);
  }

  async updateStatus(actor: AuthUser, entryId: string, connectionId: string, status: 'CONNECTED' | 'DECLINED') {
    const entry = await this.loadEntry(entryId);
    if (!actor.memberId || !this.auth.canWork(actor, entry)) {
      throw new ForbiddenException('You are not assigned to this follow-up');
    }
    const connection = entry.Connections.find((c) => c.id === connectionId);
    if (!connection) throw new NotFoundException('Suggested connection not found');

    await this.prisma.followUpConnection.update({
      where: { id: connectionId },
      data: { status: status === 'CONNECTED' ? FollowUpConnectionStatus.CONNECTED : FollowUpConnectionStatus.DECLINED },
    });

    const updated = await this.loadEntry(entryId);
    return this.mapper.mapEntry(updated, actor);
  }
}
