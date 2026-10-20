/**
 * Sentry initialisation. MUST be imported before anything else in main.ts so
 * the SDK can auto-instrument HTTP, Prisma, etc.
 *
 * Loads .env first (so SENTRY_DSN from a file is visible), then initialises
 * Sentry only when a DSN is present. With no DSN this file is a no-op and the
 * app behaves exactly as before.
 */
import '../config/load-env';
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
    sendDefaultPii: false,
    // Members write prayer requests, testimonies and lesson summaries. An error report is for finding the bug,
    // so it never carries what a request contained: not the body, not the cookies, not the query string.
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.query_string;
      }
      return event;
    },
  });
  // eslint-disable-next-line no-console
  console.log('[sentry] error monitoring enabled');
}

export const sentryEnabled = Boolean(dsn);
