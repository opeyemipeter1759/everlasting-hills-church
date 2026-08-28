import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

const MAX_SUGGESTIONS = 3;
const AGE_WINDOW_YEARS = 7;

function firstAddressToken(address: string | null): string | null {
  if (!address) return null;
  const token = address.split(',')[0]?.trim().toLowerCase();
  return token && token.length > 2 ? token : null;
}

function ageFromDate(d: Date | null): number | null {
  if (!d || isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

/**
 * Suggests 2-3 existing members who share something in common with a
 * follow-up entry's subject — gender is a hard filter (a real safety/comfort
 * boundary for an introduction), then scored by shared area and similar age.
 * This is the one feature proven to actually keep people: friendships made in
 * the first months predict whether someone stays.
 */
@Injectable()
export class FollowUpConnectionMatchService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Computes fresh suggestions and upserts them (never duplicates an existing
   * SUGGESTED/INTRODUCED/CONNECTED/DECLINED pair). Safe to call on every read. */
  async refreshSuggestions(entryId: string): Promise<void> {
    const entry = await this.prisma.followUpEntry.findFirst({
      where: { id: entryId, tenantId: this.tenantId },
      select: {
        id: true,
        sourceType: true,
        memberId: true,
        Member: { select: { gender: true, address: true, dateOfBirth: true } },
        Visitor: { select: { gender: true, address: true, dateOfBirth: true, shareForConnections: true } },
      },
    });
    if (!entry) return;

    // Consent gate: a first-timer must have opted in on their own form before
    // being surfaced to (or as) a suggested match.
    if (entry.sourceType === FollowUpSourceType.FIRST_TIMER && !entry.Visitor?.shareForConnections) return;

    const subject = entry.Member ?? entry.Visitor;
    if (!subject?.gender) return;

    const subjectAddressToken = firstAddressToken(subject.address);
    const subjectAge = entry.Member
      ? ageFromDate(entry.Member.dateOfBirth)
      : ageFromDate(entry.Visitor?.dateOfBirth ? new Date(entry.Visitor.dateOfBirth) : null);

    const candidates = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        status: MemberStatus.ACTIVE,
        gender: { equals: subject.gender, mode: 'insensitive' },
        ...(entry.memberId ? { id: { not: entry.memberId } } : {}),
      },
      select: { id: true, address: true, dateOfBirth: true },
      take: 300,
    });

    const scored = candidates
      .map((c) => {
        const attrs: string[] = [];
        const candidateToken = firstAddressToken(c.address);
        if (subjectAddressToken && candidateToken && candidateToken === subjectAddressToken) attrs.push('location');

        const candidateAge = ageFromDate(c.dateOfBirth);
        if (subjectAge !== null && candidateAge !== null && Math.abs(subjectAge - candidateAge) <= AGE_WINDOW_YEARS) {
          attrs.push('age');
        }
        return { memberId: c.id, score: attrs.length, attrs };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS);

    for (const match of scored) {
      const reason = match.attrs.includes('location') && match.attrs.includes('age')
        ? 'Same area, similar age'
        : match.attrs.includes('location')
          ? 'Same area'
          : 'Similar age';

      await this.prisma.followUpConnection.upsert({
        where: { entryId_suggestedMemberId: { entryId: entry.id, suggestedMemberId: match.memberId } },
        update: {},
        create: {
          id: randomUUID(),
          tenantId: this.tenantId,
          entryId: entry.id,
          suggestedMemberId: match.memberId,
          matchReason: reason,
          sharedAttributes: match.attrs,
        },
      });
    }
  }
}
