import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';

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

  constructor(config: ConfigService<Env, true>) {
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'http://localhost:3000').replace(/\/$/, '');
    this.revalidateSecret = config.get('CMS_REVALIDATE_SECRET', { infer: true });
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
