import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxRegistry } from '../../outbox/outbox.registry';
import { followUpEventDefinitions } from './follow-up-events';

/** Registers the follow-up events with the outbox when the app starts. */
@Injectable()
export class FollowUpEventsRegistrar implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: OutboxRegistry,
  ) {}

  onModuleInit(): void {
    const { registered, assigned, requested, decided } = followUpEventDefinitions(this.prisma);
    this.registry.register(registered);
    this.registry.register(assigned);
    this.registry.register(requested);
    this.registry.register(decided);
  }
}
