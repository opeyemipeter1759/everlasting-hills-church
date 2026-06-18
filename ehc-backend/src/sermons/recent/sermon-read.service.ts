import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import {
  SermonResponseDto,
  toSermonResponse,
} from '../dto/sermon-response.dto';
import { SERMON_REPOSITORY, type SermonRepository } from './sermon-repository';

export interface SermonFeedResult {
  items: SermonResponseDto[];
  nextCursor: string | null;
}

/**
 * Read-side service for the public sermon strip + listing. Depends only on the
 * SermonRepository seam and maps records → DTO (entity never leaves the service).
 */
@Injectable()
export class SermonReadService {
  private readonly defaultTenantId: string;

  constructor(
    @Inject(SERMON_REPOSITORY) private readonly repo: SermonRepository,
    config: ConfigService<Env, true>,
  ) {
    this.defaultTenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Tenant from request context, else the configured default. Never from the body. */
  private resolveTenant(tenantId?: string): string {
    return tenantId ?? this.defaultTenantId;
  }

  async getRecent(tenantId: string | undefined, limit: number): Promise<SermonResponseDto[]> {
    const records = await this.repo.findRecent(this.resolveTenant(tenantId), limit);
    return records.map(toSermonResponse);
  }

  async getFeed(
    tenantId: string | undefined,
    opts: { cursor?: string; pageSize: number; series?: string },
  ): Promise<SermonFeedResult> {
    const { items, nextCursor } = await this.repo.findPaginated(this.resolveTenant(tenantId), {
      cursor: opts.cursor ?? null,
      pageSize: opts.pageSize,
      series: opts.series ?? null,
    });
    return { items: items.map(toSermonResponse), nextCursor };
  }
}
