import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

  private async getMemberByEmail(email: string): Promise<{
    role: string | null;
    firstName: string | null;
    lastName: string | null;
  }> {
    let member;
    try {
      member = await this.prisma.member.findFirst({
        where: { email },
        select: {
          firstName: true,
          lastName: true,
          Profile: { select: { role: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientRustPanicError) {
        console.warn('[auth] member lookup skipped because database is unavailable:', (error as Error).message);
        return { role: null, firstName: null, lastName: null };
      }
      throw error;
    }

    return {
      role: member?.Profile?.role ?? null,
      firstName: member?.firstName ?? null,
      lastName: member?.lastName ?? null,
    };
  }

  private async getMemberRole(email: string): Promise<string | null> {
    const info = await this.getMemberByEmail(email);
    return info.role;
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
      const memberInfo = userEmail ? await this.getMemberByEmail(userEmail) : null;
      const role = memberInfo?.role ?? null;
      const fullName = memberInfo
        ? `${memberInfo.firstName ?? ''} ${memberInfo.lastName ?? ''}`.trim() || null
        : null;
      const picture =
        (data.user.user_metadata &&
          (data.user.user_metadata.avatar_url || data.user.user_metadata.picture)) ||
        (data.user as any).avatar_url ||
        (data.user as any).picture ||
        null;

      return {
        access_token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role,
          fullName,
          picture,
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

  async getProfile(authorization?: string) {
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

      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Supabase getUser error:', error.message);
        throw new UnauthorizedException('Invalid access token');
      }

      const user = data?.user;
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const userEmail = String(user.email ?? '');
      const memberInfo = userEmail ? await this.getMemberByEmail(userEmail) : null;
      const role = memberInfo?.role ?? null;
      const fullName = memberInfo
        ? `${memberInfo.firstName ?? ''} ${memberInfo.lastName ?? ''}`.trim() || null
        : null;

      const picture =
        (user.user_metadata &&
          (user.user_metadata.avatar_url || user.user_metadata.picture)) ||
        // some providers put it directly on the user object
        (user as any).avatar_url ||
        (user as any).picture ||
        null;

      return {
        id: user.id,
        email: user.email,
        role,
        fullName,
        picture,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Get profile error:', error);
      throw new UnauthorizedException('Could not fetch user profile');
    }
  }
}
