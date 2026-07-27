import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SermonMemberLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      return null;
    }

    return this.prisma.member.findUnique({ where: { profileId: profile.id } });
  }
}
