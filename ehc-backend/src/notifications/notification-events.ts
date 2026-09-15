/**
 * Typed event payloads for fire-and-forget notification handlers.
 *
 * When BullMQ (Redis) ships, these become Queue job names + payloads — same shape,
 * different transport. Until then, EventEmitterModule dispatches them in-process.
 *
 * Tradeoff vs BullMQ:
 *   ✓ Zero infra (no Redis)
 *   ✓ Form submissions return immediately (user-visible win)
 *   ✗ No retries / backoff
 *   ✗ Lost if the process crashes mid-handler
 *   ✗ No cross-instance distribution
 *
 * Acceptable for non-critical email (admin notifications + thank-yous). For anything
 * transactionally critical, wait for Redis.
 */

export const NotificationEvents = {
  SendEmail: 'notification.email.send',
} as const;

/** Domain events other modules react to out-of-band. */
export const VisitorEvents = {
  /** A first-timer was recorded (form, bulk import, quick capture). The
   * Follow-Up pipeline listens and surfaces them straight away. */
  Created: 'visitor.created',
} as const;

export interface VisitorCreatedPayload {
  visitorIds: string[];
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  text: string;
  /** Optional rendered HTML. Resend sends `html` when present; `text` is still used as the fallback. */
  html?: string;
  /** Files to attach — Resend fetches each by URL at send time, so nothing is
   * buffered through the queue. */
  attachments?: { filename: string; url: string }[];
  /** Tag for logging — e.g. "first-timer-admin", "prayer-request-visitor". */
  tag: string;
}
