/** BullMQ queue + job names. Kept in one place so producers and consumers agree. */
export const EMAIL_QUEUE = 'email';
export const EMAIL_JOB_SEND = 'send';

/** True when a Redis connection is configured (background queue is active). */
export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}
