import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { UpdateProfileDetailsDto } from '../dto/profile-details.dto';

export const VISIBILITY_KEYS = ['profile', 'career', 'testimony', 'journey', 'birthday', 'socials', 'phone'] as const;
export type VisibilityKey = (typeof VISIBILITY_KEYS)[number];
export type Visibility = Record<VisibilityKey, 'MEMBERS' | 'PRIVATE'>;

/** Everything shown to the church family unless the member says otherwise, except their phone number. */
export const DEFAULT_VISIBILITY: Visibility = {
  profile: 'MEMBERS',
  career: 'MEMBERS',
  testimony: 'MEMBERS',
  journey: 'MEMBERS',
  birthday: 'MEMBERS',
  socials: 'MEMBERS',
  phone: 'PRIVATE',
};

export const OPEN_TO = ['PRAYER_PARTNER', 'MENTOR', 'MENTEE', 'FELLOWSHIP', 'NETWORKING', 'VOLUNTEERING'] as const;

export function visibilityOf(raw: unknown): Visibility {
  const stored = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_VISIBILITY };
  for (const key of VISIBILITY_KEYS) {
    if (stored[key] === 'MEMBERS' || stored[key] === 'PRIVATE') out[key] = stored[key] as 'MEMBERS' | 'PRIVATE';
  }
  return out;
}

/** Trimmed, without repeats (ignoring case), a sensible number of short items. */
export function cleanList(items: string[] | undefined, max = 15): string[] | undefined {
  if (!items) return undefined;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

const text = (value: string | null | undefined) => (value === undefined ? undefined : value?.trim() || null);

type Details = Prisma.MemberProfileDetailsGetPayload<object>;

/**
 * The part of a profile a member writes for themselves, LinkedIn-style:
 * headline and banner, favourite scripture, spiritual journey, career, gifts,
 * interests, languages, prayer focus, testimony, what they are open to, and
 * who may see each part.
 */
@Injectable()
export class MemberProfileDetailsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private shape(d: Details | null) {
    return {
      headline: d?.headline ?? null,
      coverUrl: d?.coverUrl ?? null,
      favouriteVerse: d?.favouriteVerse ?? null,
      favouriteVerseRef: d?.favouriteVerseRef ?? null,
      bornAgainYear: d?.bornAgainYear ?? null,
      waterBaptismYear: d?.waterBaptismYear ?? null,
      holySpiritYear: d?.holySpiritYear ?? null,
      membershipClassYear: d?.membershipClassYear ?? null,
      occupation: d?.occupation ?? null,
      employer: d?.employer ?? null,
      industry: d?.industry ?? null,
      skills: d?.skills ?? [],
      gifts: d?.gifts ?? [],
      interests: d?.interests ?? [],
      languages: d?.languages ?? [],
      prayerFocus: d?.prayerFocus ?? null,
      testimony: d?.testimony ?? null,
      openTo: d?.openTo ?? [],
      visibility: visibilityOf(d?.visibility),
    };
  }

  async mine(memberId: string) {
    return this.shape(await this.prisma.memberProfileDetails.findUnique({ where: { memberId } }));
  }

  async update(memberId: string, dto: UpdateProfileDetailsDto) {
    const current = await this.prisma.memberProfileDetails.findUnique({ where: { memberId }, select: { visibility: true } });
    const data = {
      headline: text(dto.headline),
      favouriteVerse: text(dto.favouriteVerse),
      favouriteVerseRef: text(dto.favouriteVerseRef),
      bornAgainYear: dto.bornAgainYear,
      waterBaptismYear: dto.waterBaptismYear,
      holySpiritYear: dto.holySpiritYear,
      membershipClassYear: dto.membershipClassYear,
      occupation: text(dto.occupation),
      employer: text(dto.employer),
      industry: text(dto.industry),
      skills: cleanList(dto.skills),
      gifts: cleanList(dto.gifts),
      interests: cleanList(dto.interests),
      languages: cleanList(dto.languages, 8),
      prayerFocus: text(dto.prayerFocus),
      testimony: text(dto.testimony),
      openTo: dto.openTo ? dto.openTo.filter((o) => (OPEN_TO as readonly string[]).includes(o)) : undefined,
      visibility: dto.visibility
        ? (visibilityOf({ ...visibilityOf(current?.visibility), ...dto.visibility }) as Prisma.InputJsonValue)
        : undefined,
    };
    const saved = await this.prisma.memberProfileDetails.upsert({
      where: { memberId },
      create: { memberId, tenantId: this.tenantId, ...data },
      update: data,
    });
    return this.shape(saved);
  }

  async setCover(memberId: string, coverUrl: string | null) {
    await this.prisma.memberProfileDetails.upsert({
      where: { memberId },
      create: { memberId, tenantId: this.tenantId, coverUrl },
      update: { coverUrl },
    });
    return { coverUrl };
  }

  /**
   * What another member may see. Pastors and admins, and the member
   * themselves, see everything; others see what the member has opened to them.
   * A private profile leaves only the name, photo, banner and headline.
   */
  async forViewer(memberId: string, seesAll: boolean) {
    const details = this.shape(await this.prisma.memberProfileDetails.findUnique({ where: { memberId } }));
    const v = details.visibility;
    const open = (key: VisibilityKey) => seesAll || v[key] === 'MEMBERS';
    let phone: string | null = null;
    if (open('phone')) {
      const member = await this.prisma.member.findUnique({ where: { id: memberId }, select: { phone: true } });
      phone = member?.phone ?? null;
    }
    return {
      restricted: !open('profile'),
      headline: details.headline,
      coverUrl: details.coverUrl,
      favouriteVerse: details.favouriteVerse,
      favouriteVerseRef: details.favouriteVerseRef,
      journey: open('journey')
        ? {
            bornAgainYear: details.bornAgainYear,
            waterBaptismYear: details.waterBaptismYear,
            holySpiritYear: details.holySpiritYear,
            membershipClassYear: details.membershipClassYear,
          }
        : null,
      career: open('career')
        ? { occupation: details.occupation, employer: details.employer, industry: details.industry, skills: details.skills }
        : null,
      gifts: details.gifts,
      interests: details.interests,
      languages: details.languages,
      prayerFocus: details.prayerFocus,
      testimony: open('testimony') ? details.testimony : null,
      openTo: details.openTo,
      phone,
      showBirthday: open('birthday'),
      showSocials: open('socials'),
    };
  }
}
