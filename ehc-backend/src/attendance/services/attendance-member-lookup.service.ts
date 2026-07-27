import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Resolves the signed-in user's Member row from their Supabase userId.
 *
 * Self-healing: if a Profile exists but no Member row is attached, we
 * auto-provision a minimal Member using the JWT email so check-in just
 * works for orphan accounts (e.g. a SUPER_ADMIN seeded before the Member
 * code path existed, or a user whose Member row was deleted).
 *
 * Returns null only when the Profile itself is missing — that genuinely
 * needs an admin to assign a role.
 */
@Injectable()
export class AttendanceMemberLookupService {
  private readonly logger = new Logger(AttendanceMemberLookupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMemberByUserId(userId: string, fallbackEmail?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true, tenantId: true },
    });
    if (!profile) {
      return null;
    }

    const existing = await this.prisma.member.findUnique({
      where: { profileId: profile.id },
    });
    if (existing) return existing;

    // Auto-provision
    const created = await this.prisma.member.create({
      data: {
        id: randomUUID(),
        tenantId: profile.tenantId,
        profileId: profile.id,
        firstName: 'New',
        lastName: 'Member',
        email: fallbackEmail ?? null,
      },
    });
    this.logger.log(
      `Auto-provisioned Member ${created.id} for orphan profile ${profile.id} (${fallbackEmail ?? 'no email'})`,
    );
    return created;
  }
}
