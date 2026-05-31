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

export interface SendEmailPayload {
  to: string;
  subject: string;
  text: string;
  /** Optional rendered HTML. Resend sends `html` when present; `text` is still used as the fallback. */
  html?: string;
  /** Tag for logging — e.g. "first-timer-admin", "prayer-request-visitor". */
  tag: string;
}
