import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Default throttling tracks by IP alone, which over-blocks whenever many
 * different people share one IP — a church's wifi/NAT at service time being
 * the exact case that prompted this. For a request carrying an `email` in the
 * body (login, forgot-password), track per IP+email instead: an attacker
 * hammering one account from one IP is still limited exactly as before, but
 * two different members logging in from the same network no longer share a
 * bucket and lock each other out. Routes with no body email (or no IP) fall
 * back to the default IP-only tracking.
 */
@Injectable()
export class AccountAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip: string = req.ip;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : null;
    return email ? `${ip}:${email}` : ip;
  }
}
