import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { effectiveMaritalStatus } from './member-spouse.service';

const PAGE_SIZE = 24;

/** Day and month only: the year of birth is nobody else's business. */
function dayMonth(date: Date | null): { day: number; month: number } | null {
  return date ? { day: date.getUTCDate(), month: date.getUTCMonth() + 1 } : null;
}

/**
 * The church family: every signed-in member can find and open any active
 * member's profile.
 *
 * Only what a member would share with the congregation is returned: name,
 * photo, story, service teams, birthday (day and month), marital status with
 * a confirmed spouse, and their social links. Phone, email, address, date of
 * birth's year, tags and pastoral records stay with the member and the admins.
 */
@Injectable()
export class MemberFamilyService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async directory(query: string | undefined, page = 1) {
    const q = (query ?? '').trim().slice(0, 60);
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 3);
    const where: Prisma.MemberWhereInput = {
      tenantId: this.tenantId,
      status: MemberStatus.ACTIVE,
      ...(terms.length > 0 && {
        AND: terms.map((t) => ({
          OR: [
            { firstName: { contains: t, mode: 'insensitive' as const } },
            { lastName: { contains: t, mode: 'insensitive' as const } },
          ],
        })),
      }),
    };
    const current = Math.max(1, Math.floor(page) || 1);
    const [total, rows] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          UnitMember: { select: { Unit: { select: { name: true } } }, take: 2 },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip: (current - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    return {
      items: rows.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        photoUrl: m.photoUrl,
        units: m.UnitMember.map((u) => u.Unit.name),
      })),
      total,
      page: current,
      pageSize: PAGE_SIZE,
    };
  }

  async profile(id: string) {
    const m = await this.prisma.member.findFirst({
      where: { id, tenantId: this.tenantId, status: MemberStatus.ACTIVE },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        bio: true,
        gender: true,
        joinedAt: true,
        dateOfBirth: true,
        weddingAnniversary: true,
        maritalStatus: true,
        spouseName: true,
        Spouse: { select: { id: true, firstName: true, lastName: true, photoUrl: true, status: true } },
        instagram: true,
        facebook: true,
        twitter: true,
        linkedin: true,
        tiktok: true,
        UnitMember: {
          select: { isLead: true, isAssistant: true, Unit: { select: { id: true, name: true, description: true } } },
        },
      },
    });
    if (!m) throw new NotFoundException('That member could not be found.');
    const married = effectiveMaritalStatus(m) === 'MARRIED';
    const spouse = married && m.Spouse && m.Spouse.status === MemberStatus.ACTIVE ? m.Spouse : null;
    return {
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      photoUrl: m.photoUrl,
      bio: m.bio,
      gender: m.gender,
      joinedAt: m.joinedAt,
      birthday: dayMonth(m.dateOfBirth),
      maritalStatus: married ? 'MARRIED' : 'SINGLE',
      anniversary: married ? dayMonth(m.weddingAnniversary) : null,
      spouse: spouse
        ? { id: spouse.id, name: `${spouse.firstName} ${spouse.lastName}`.trim(), photoUrl: spouse.photoUrl }
        : null,
      spouseName: married && !spouse ? m.spouseName : null,
      socials: { instagram: m.instagram, facebook: m.facebook, twitter: m.twitter, linkedin: m.linkedin, tiktok: m.tiktok },
      units: m.UnitMember.map((u) => ({
        id: u.Unit.id,
        name: u.Unit.name,
        description: u.Unit.description,
        isLead: u.isLead,
        isAssistant: u.isAssistant,
      })),
    };
  }
}
