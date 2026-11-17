import type { PushCategory } from '../push/push.types';

/** What a notification says. Push text is lock-screen safe: a first name and an action, nothing pastoral. */
export interface OutboxMessage {
  title: string;
  body: string;
  /** In-app path opened from the bell or the push. */
  link: string;
}

/**
 * One kind of event: who hears about it and what they are told. A new workflow
 * is one more of these, registered by the module that owns it.
 */
export interface OutboxEventDefinition<P = Record<string, unknown>> {
  type: string;
  /** Profile ids to tell, resolved from current assignment rows at dispatch time. */
  recipients(payload: P, tenantId: string): Promise<string[]>;
  message(payload: P): OutboxMessage;
  /** Set for actionable events that should also go out as a web push. */
  push?: { category: PushCategory };
}

export interface RecordEventInput {
  tenantId: string;
  type: string;
  payload: Record<string, unknown>;
  /** Profile id of whoever caused it; they are never notified about their own action. */
  actorId?: string | null;
}

/** Retries back off 1, 2, 4 and 8 minutes; the fifth failure marks the event FAILED for admins to see. */
export const MAX_ATTEMPTS = 5;
export const backoffMs = (attempts: number) => 60_000 * 2 ** Math.max(0, attempts - 1);
