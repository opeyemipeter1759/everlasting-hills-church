import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import type { TypedConfigService } from '../config/env.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private readonly anonClient: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    config: TypedConfigService,
  ) {
    this.supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    this.supabaseAnonKey = config.get('SUPABASE_ANON_KEY', { infer: true });
    this.anonClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * Look up the application role for an authenticated Supabase user.
   * Returns null if the user has signed up but has no Profile yet.
   */
  private async getMemberRole(email: string): Promise<string | null> {
    const member = await this.prisma.member.findFirst({
      where: { email },
      select: { Profile: { select: { role: true } } },
    });
    return member?.Profile?.role ?? null;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.anonClient.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) {
      this.logger.warn(`Login failed for ${email}: ${error?.message ?? 'no session'}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const userEmail = String(data.user.email ?? '');
    const role = userEmail ? await this.getMemberRole(userEmail) : null;

    return {
      access_token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email, role, fullName, picture },
      //session: { access_token: data.session.access_token, expires_in: data.session.expires_in, token_type: data.session.token_type },
    };
  }

  async logout(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!accessToken) throw new UnauthorizedException('Access token is required');

    const scoped = createClient(this.supabaseUrl, this.supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await scoped.auth.signOut();
    if (error) {
      this.logger.warn(`Logout failed: ${error.message}`);
      throw new UnauthorizedException('Logout failed');
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async getProfile(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!accessToken) throw new UnauthorizedException('Access token is required');

    const supabase = createClient(this.supabaseUrl, this.supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      this.logger.warn('Supabase getUser error: ' + error.message);
      throw new UnauthorizedException('Invalid access token');
    }
    const user = data?.user;
    if (!user) throw new UnauthorizedException('User not found');

    const userEmail = String(user.email ?? '');
    const memberInfo = userEmail ? await this.getMemberByEmail(userEmail) : null;
    const role = memberInfo?.role ?? null;
    const fullName = memberInfo ? `${memberInfo.firstName ?? ''} ${memberInfo.lastName ?? ''}`.trim() || null : null;
    const picture = (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || (user as any).avatar_url || (user as any).picture || null;

    return { id: user.id, email: user.email, role, fullName, picture };
  }
}
