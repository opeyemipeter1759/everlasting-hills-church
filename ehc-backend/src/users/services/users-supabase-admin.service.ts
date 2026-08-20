import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import ws from 'ws';
import type { Env } from '../../config/env.validation';

/**
 * Lazy admin client. The Supabase SDK refuses to construct with an empty key, so
 * we delay creation until first use and throw a clear error.
 */
@Injectable()
export class UsersSupabaseAdminService {
  private readonly logger = new Logger(UsersSupabaseAdminService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseServiceRoleKey: string | undefined;
  private client: SupabaseClient | null = null;

  constructor(config: ConfigService<Env, true>) {
    this.supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    this.supabaseServiceRoleKey = config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }) as
      | string
      | undefined;
    if (!this.supabaseServiceRoleKey) {
      // Don't throw at boot — let create() fail at call time with a clear message.
      // The app still boots; only the create-user path is unavailable.
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY not set — POST /users will fail with 500 until configured',
      );
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabaseServiceRoleKey) {
      throw new BadRequestException(
        'User management is not configured on this server. Set SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    if (!this.client) {
      this.client = createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: ws as unknown as WebSocketLikeConstructor },
      });
    }
    return this.client;
  }
}
