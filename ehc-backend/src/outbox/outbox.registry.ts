import { Injectable } from '@nestjs/common';
import type { OutboxEventDefinition } from './outbox.types';

/** Every event type the outbox can dispatch. Owning modules register theirs on start-up. */
@Injectable()
export class OutboxRegistry {
  private readonly definitions = new Map<string, OutboxEventDefinition>();

  register<P>(definition: OutboxEventDefinition<P>): void {
    this.definitions.set(definition.type, definition as unknown as OutboxEventDefinition);
  }

  get(type: string): OutboxEventDefinition | undefined {
    return this.definitions.get(type);
  }
}
