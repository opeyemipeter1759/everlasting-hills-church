import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberSelfLookupService } from './member-self-lookup.service';
import type { UpdateMyProfileDto } from '../dto/update-my-profile.dto';
import { MemberSpouseService } from './member-spouse.service';

/** Self-service profile edits (name/phone/bio/socials — never role or status). */
@Injectable()
export class MemberProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selfLookup: MemberSelfLookupService,
    private readonly spouse: MemberSpouseService,
  ) {}

  async updateMyProfile(
    userId: string,
    data: UpdateMyProfileDto,
    fallbackEmail?: string,
  ) {
    const { memberId } = await this.selfLookup.getMyMember(userId, fallbackEmail);
    const current = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { spouseMemberId: true },
    });
    const single = data.maritalStatus === 'SINGLE';
    const typedSpouse = data.spouseName === undefined ? undefined : data.spouseName?.trim() || null;
    if (typedSpouse && current?.spouseMemberId && !single) {
      throw new BadRequestException('Remove your linked spouse before typing another name.');
    }
    // Single ends any spouse link, for both members, and withdraws any ask.
    if (single) await this.prisma.$transaction(this.spouse.unlinkOps(memberId));
    const spouseMemberId = single ? null : (current?.spouseMemberId ?? null);

    const updated = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...(data.maritalStatus !== undefined && { maritalStatus: data.maritalStatus }),
        ...(single && { spouseName: null, weddingAnniversary: null }),
        ...(!single && typedSpouse !== undefined && { spouseName: typedSpouse }),
        ...(data.firstName !== undefined && {
          firstName: data.firstName.trim(),
        }),
        ...(data.lastName !== undefined && {
          lastName: data.lastName == null ? '' : data.lastName.trim(),
        }),
        ...(data.phone !== undefined && {
          phone:
            data.phone == null || data.phone === '' ? null : data.phone.trim(),
        }),
        ...(data.bio !== undefined && {
          bio: data.bio == null || data.bio === '' ? null : data.bio.trim(),
        }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(!single && data.weddingAnniversary !== undefined && {
          weddingAnniversary: data.weddingAnniversary
            ? new Date(data.weddingAnniversary)
            : null,
        }),
        ...(data.instagram !== undefined && {
          instagram:
            data.instagram == null || data.instagram === ''
              ? null
              : data.instagram.trim(),
        }),
        ...(data.facebook !== undefined && {
          facebook:
            data.facebook == null || data.facebook === ''
              ? null
              : data.facebook.trim(),
        }),
        ...(data.twitter !== undefined && {
          twitter:
            data.twitter == null || data.twitter === ''
              ? null
              : data.twitter.trim(),
        }),
        ...(data.linkedin !== undefined && {
          linkedin:
            data.linkedin == null || data.linkedin === ''
              ? null
              : data.linkedin.trim(),
        }),
        ...(data.tiktok !== undefined && {
          tiktok:
            data.tiktok == null || data.tiktok === '' ? null : data.tiktok.trim(),
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bio: true,
        photoUrl: true,
        gender: true,
        dateOfBirth: true,
        weddingAnniversary: true,
        instagram: true,
        facebook: true,
        twitter: true,
        linkedin: true,
        tiktok: true,
        maritalStatus: true,
        spouseName: true,
      },
    });
    // A couple shares one wedding date.
    if (spouseMemberId && !single && data.weddingAnniversary !== undefined) {
      await this.prisma.member.update({
        where: { id: spouseMemberId },
        data: { weddingAnniversary: updated.weddingAnniversary },
      });
    }
    return updated;
  }
}
