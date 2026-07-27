import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Resolves the signed-in user's Member row from their Supabase userId.
 *
 * Self-healing: if a Profile exists but no Member row is attached, we create
 * one on the fly using the email from the JWT. This handles "orphan" accounts
 * (e.g. a SUPER_ADMIN seeded before the Member-row code path existed, or a
 * user whose Member row was deleted but whose Profile + auth user survived).
 *
 * Throws only when the Profile itself is missing — that genuinely needs an
 * admin to set the role.
 */
@Injectable()
export class MemberSelfLookupService {
  private readonly logger = new Logger(MemberSelfLookupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyMember(userId: string, fallbackEmail?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!profile) {
      throw new NotFoundException(
        'Your account has no profile yet. Contact an admin.',
      );
    }
    if (profile.Member) {
      return { profileId: profile.id, memberId: profile.Member.id };
    }

    // Auto-provision a minimal Member row. The user can edit names/phone/bio
    // from /dashboard/settings; we just need a row so subsequent updates work.
    const member = await this.prisma.member.create({
      data: {
        id: randomUUID(),
        tenantId: profile.tenantId,
        profileId: profile.id,
        firstName: 'New',
        lastName: 'Member',
        email: fallbackEmail ?? null,
      },
      select: { id: true },
    });
    this.logger.log(
      `Auto-provisioned Member ${member.id} for orphan profile ${profile.id} (${fallbackEmail ?? 'no email'})`,
    );
    return { profileId: profile.id, memberId: member.id };
  }
}
