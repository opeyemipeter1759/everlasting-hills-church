import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/** Lightweight member search: the "pick a person" picker and the flat active-member list. */
@Injectable()
export class MemberSearchService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Member-safe search for "pick a person" UI (e.g. addressing a sermon note/question to
   * someone, or a unit lead adding a member to their unit). Deliberately returns only
   * display-safe fields — no email/phone/tags — since, unlike getAllMembers/getDirectory,
   * this is reachable by any signed-in MEMBER, not just ADMIN+.
   *
   * An empty/short query lists active members (capped) rather than returning nothing, so
   * pickers can show the full roster up front instead of forcing a search first.
   */
  async searchMembersForPicker(query: string, requestingUserId: string) {
    const q = query.trim();
    const isSearch = q.length >= 2;

    const profile = await this.prisma.profile.findUnique({ where: { userId: requestingUserId } });
    const self = profile ? await this.prisma.member.findUnique({ where: { profileId: profile.id } }) : null;

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        status: MemberStatus.ACTIVE,
        ...(self && { id: { not: self.id } }),
        ...(isSearch && {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      select: { id: true, firstName: true, lastName: true, photoUrl: true },
      orderBy: [{ firstName: 'asc' }],
      take: isSearch ? 15 : 50,
    });

    return members;
  }

  async getAllMembers(opts?: { search?: string; status?: string }) {
    const where: any = { tenantId: this.tenantId };
    if (opts?.status) where.status = opts.status;
    if (opts?.search) {
      where.OR = [
        { firstName: { contains: opts.search, mode: 'insensitive' } },
        { lastName: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
        { phone: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.member.findMany({
      where,
      orderBy: [{ joinedAt: 'desc' }],
      include: { _count: { select: { AttendanceRecord: true } } },
      // This endpoint returns a flat array (not the {data,meta} envelope), so it can't be
      // paginated without breaking existing callers (e.g. AddMemberForm's active-member
      // picker). Cap it instead — the paginated, filterable directory endpoint is the
      // right place for anything that needs to browse the full membership list.
      take: 1000,
    });
  }
}
