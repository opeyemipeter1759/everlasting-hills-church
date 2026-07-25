import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EffectiveRolesService } from '../effective-roles.service';

/**
 * Returns the currently-authenticated user's identity + their Member profile.
 * The userId is sourced from the JWT (already verified by JwtAuthGuard).
 *
 * Used by /auth/me on the controller — the dashboard's single point of truth for
 * "who am I and what does my profile look like".
 */
@Injectable()
export class AuthMeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
  ) {}

  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        tenantId: true,
        Member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            dateOfBirth: true,
            weddingAnniversary: true,
            gender: true,
            instagram: true,
            facebook: true,
            twitter: true,
            linkedin: true,
            tiktok: true,
            bio: true,
            photoUrl: true,
            joinedAt: true,
            tags: true,
            Household: { select: { name: true } },
            UnitMember: {
              select: {
                isLead: true,
                isAssistant: true,
                Unit: { select: { id: true, name: true, description: true } },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      // Authenticated Supabase user with no Profile row yet — orphan account.
      // Return enough for the UI to render a "complete your profile" state.
      return {
        profileId: null, role: null, tenantId: null, member: null,
        effectiveRoles: [], unitLeadOf: [], adminHeadOf: [], hodOf: [], headUsher: false,
      };
    }

    // Effective roles + scopes drive the role-aware dashboard navigation.
    const eff = await this.effectiveRoles.getEffectiveRoles(profile.id);

    // Gender is editable directly on Member now, but members converted from the
    // public first-timer form may only have it on their original Visitor row.
    // Prefer Member.gender; fall back to the Visitor record by email/phone so
    // older converted members still see a value without re-asking.
    let gender = profile.Member?.gender ?? null;
    if (!gender && profile.Member && (profile.Member.email || profile.Member.phone)) {
      const visitor = await this.prisma.visitor.findFirst({
        where: {
          tenantId: profile.tenantId,
          OR: [
            profile.Member.email ? { email: profile.Member.email } : undefined,
            profile.Member.phone ? { phone: profile.Member.phone } : undefined,
          ].filter(Boolean) as Array<{ email: string } | { phone: string }>,
        },
        select: { gender: true },
      });
      gender = visitor?.gender ?? null;
    }

    const {
      Household,
      UnitMember,
      dateOfBirth,
      weddingAnniversary,
      joinedAt,
      gender: _g,
      ...rest
    } = profile.Member ?? {};

    return {
      profileId: profile.id,
      role: eff.primaryRole,
      effectiveRoles: eff.roles,
      unitLeadOf: eff.unitLeadOf,
      adminHeadOf: eff.adminHeadOf,
      hodOf: eff.hodOf,
      headUsher: eff.headUsher,
      tenantId: profile.tenantId,
      member: profile.Member
        ? {
            ...rest,
            dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
            weddingAnniversary: weddingAnniversary ? weddingAnniversary.toISOString() : null,
            joinedAt: joinedAt!.toISOString(),
            household: Household?.name ?? null,
            gender,
            units: (UnitMember ?? []).map((um) => ({
              id: um.Unit.id,
              name: um.Unit.name,
              description: um.Unit.description,
              isLead: um.isLead,
              isAssistant: um.isAssistant,
            })),
          }
        : null,
    };
  }
}
