import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberSelfLookupService } from './member-self-lookup.service';
import type { UpdateMyProfileDto } from '../dto/update-my-profile.dto';

/** Self-service profile edits (name/phone/bio/socials — never role or status). */
@Injectable()
export class MemberProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selfLookup: MemberSelfLookupService,
  ) {}

  async updateMyProfile(
    userId: string,
    data: UpdateMyProfileDto,
    fallbackEmail?: string,
  ) {
    const { memberId } = await this.selfLookup.getMyMember(userId, fallbackEmail);
    return this.prisma.member.update({
      where: { id: memberId },
      data: {
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
        ...(data.weddingAnniversary !== undefined && {
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
      },
    });
  }
}
