import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(private prisma: PrismaService) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables',
      );
    }
    this.supabaseUrl = url;
    this.supabaseAnonKey = key;
  }

  private createSupabaseClient() {
    return createClient(this.supabaseUrl, this.supabaseAnonKey);
  }

  private async getMemberRole(email: string): Promise<string | null> {
    const member = await this.prisma.member.findFirst({
      where: { email },
      select: { Profile: { select: { role: true } } },
    });
    return member?.Profile?.role ?? null;
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    try {
      const supabase = this.createSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error.message);
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException('Authentication failed');
      }

      const userEmail = String(data.user.email ?? '');
      const role = userEmail ? await this.getMemberRole(userEmail) : null;

      return {
        access_token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
        },
        session: {
          access_token: data.session.access_token,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Login error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async logout(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase sign out error:', error.message);
        throw new UnauthorizedException('Logout failed');
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Logout error:', error);
      throw new UnauthorizedException('Logout failed');
    }
  }
}
