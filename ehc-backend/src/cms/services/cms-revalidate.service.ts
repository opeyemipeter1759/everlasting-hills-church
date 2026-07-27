import { Injectable, Logger } from '@nestjs/common';

/**
 * Asks the Next.js site to revalidate ISR cache tags / paths after a publish.
 * Fire-and-forget server-to-server call; failures are logged, never thrown into
 * the publish path (the DB is already the source of truth).
 */
@Injectable()
export class CmsRevalidateService {
  private readonly logger = new Logger(CmsRevalidateService.name);
  private readonly appUrl: string;
  private readonly revalidateSecret: string;

  constructor() {
    this.appUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    this.revalidateSecret =
      process.env.CMS_REVALIDATE_SECRET ??
      process.env.SUPABASE_JWT_SECRET ??
      'ehc-cms-revalidate';
  }

  trigger(tags: string[] = [], paths: string[] = []) {
    void fetch(`${this.appUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': this.revalidateSecret,
      },
      body: JSON.stringify({ tags, paths }),
    }).catch((err) => this.logger.warn(`ISR revalidate call failed: ${(err as Error).message}`));
  }
}
