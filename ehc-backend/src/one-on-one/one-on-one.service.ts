import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PastoralBookingStatus, PastoralRequesterType, Prisma, Role, type PastorHost } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { GoogleTokenCipherService } from '../calendar/services/google-token-cipher.service';
import { OneOnOneCalendarService } from './one-on-one-calendar.service';
import type { AuthUser } from '../auth/types/auth-user';
import { meetsRole } from '../auth/guards/roles.guard';
import {
  AddDelegateDto,
  CreateBlockDto,
  CreateSessionTypeDto,
  ReplaceRulesDto,
  SlotsQueryDto,
  UpdateHostSettingsDto,
  UpdateSessionTypeDto,
} from './dto/one-on-one.dto';
import { addDaysToKey, computeSlots, localDateKey, parseHhmm, wallTime, type BusyInterval, type WeeklyWindow } from './slot-engine';

export type Audience = 'MEMBER' | 'VISITOR';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Monday of the Lagos week a local date falls in, as "YYYY-MM-DD". */
function weekOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDaysToKey(date, -((day + 6) % 7));
}

type Db = PrismaService | Prisma.TransactionClient;

/** Statuses that occupy a pastor's time. HOLD only counts until it expires. */
export const ACTIVE_STATUSES: PastoralBookingStatus[] = [
  PastoralBookingStatus.HOLD,
  PastoralBookingStatus.PENDING,
  PastoralBookingStatus.PROPOSED,
  PastoralBookingStatus.APPROVED,
];

const MAX_RANGE_DAYS = 62;

const DEFAULT_SESSION_TYPES = [
  { name: 'Counsel & prayer', description: 'An hour to talk things through and pray together.', durationMinutes: 60, visitorsCanBook: true, position: 0 },
  { name: 'Extended session', description: 'Two hours, for something that needs more time.', durationMinutes: 120, visitorsCanBook: false, position: 1 },
];

type HostWithRules = Prisma.PastorHostGetPayload<{ include: { Rules: true; Blocks: true } }>;

export interface SlotDay {
  date: string;
  slots: { startsAt: string; endsAt: string }[];
}

/** Overlap of two sets of weekly windows, for sessions with both pastors. */
export function intersectWindows(a: WeeklyWindow[], b: WeeklyWindow[]): WeeklyWindow[] {
  const out: WeeklyWindow[] = [];
  for (const x of a) {
    for (const y of b) {
      if (x.weekday !== y.weekday) continue;
      const start = Math.max(parseHhmm(x.startTime), parseHhmm(y.startTime));
      const end = Math.min(parseHhmm(x.endTime), parseHhmm(y.endTime));
      if (start < end) out.push({ weekday: x.weekday, startTime: toHhmm(start), endTime: toHhmm(end) });
    }
  }
  return out;
}

function toHhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

@Injectable()
export class OneOnOneService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: GoogleTokenCipherService,
    private readonly calendar: OneOnOneCalendarService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Private notes are only accepted when they can be stored encrypted. */
  get notesEnabled(): boolean {
    return this.cipher.isConfigured;
  }

  // ── Access ────────────────────────────────────────────────────────────────

  private isSuperAdmin(user: AuthUser): boolean {
    return user.effectiveRoles?.includes(Role.SUPER_ADMIN) ?? false;
  }

  private async loadHost(hostId: string): Promise<PastorHost> {
    const host = await this.prisma.pastorHost.findFirst({ where: { id: hostId, tenantId: this.tenantId } });
    if (!host) throw new NotFoundException('Pastor not found');
    return host;
  }

  /** The pastor themself, one of their delegates, or the Super Admin. */
  async assertCanManage(user: AuthUser, hostId: string): Promise<{ host: PastorHost; isOwner: boolean }> {
    const host = await this.loadHost(hostId);
    const isOwner = host.profileId === user.profileId;
    if (isOwner || this.isSuperAdmin(user)) return { host, isOwner };
    const delegate = await this.prisma.pastorDelegate.findFirst({ where: { hostId, delegateProfileId: user.profileId ?? '' } });
    if (!delegate) throw new ForbiddenException("You don't manage this pastor's sessions");
    return { host, isOwner };
  }

  /** Appointing delegates is for the pastor themself or the Super Admin, never another delegate. */
  private async assertCanAppoint(user: AuthUser, hostId: string): Promise<PastorHost> {
    const host = await this.loadHost(hostId);
    if (host.profileId !== user.profileId && !this.isSuperAdmin(user)) {
      throw new ForbiddenException('Only the pastor can appoint delegates');
    }
    return host;
  }

  // ── Manage: setup and context ─────────────────────────────────────────────

  /** Which pastors this person can manage, and whether they can set themselves up as one. */
  async getManageContext(user: AuthUser) {
    const profileId = user.profileId ?? '';
    const [own, delegations, all] = await Promise.all([
      this.prisma.pastorHost.findFirst({ where: { tenantId: this.tenantId, profileId } }),
      this.prisma.pastorDelegate.findMany({ where: { tenantId: this.tenantId, delegateProfileId: profileId }, include: { Host: true } }),
      this.isSuperAdmin(user)
        ? this.prisma.pastorHost.findMany({ where: { tenantId: this.tenantId }, orderBy: { position: 'asc' } })
        : Promise.resolve([] as PastorHost[]),
    ]);

    const hosts = new Map<string, { hostId: string; displayName: string; access: 'OWNER' | 'DELEGATE' | 'SUPER_ADMIN' }>();
    if (own) hosts.set(own.id, { hostId: own.id, displayName: own.displayName, access: 'OWNER' });
    for (const d of delegations) {
      if (!hosts.has(d.hostId)) hosts.set(d.hostId, { hostId: d.hostId, displayName: d.Host.displayName, access: 'DELEGATE' });
    }
    for (const h of all) {
      if (!hosts.has(h.id)) hosts.set(h.id, { hostId: h.id, displayName: h.displayName, access: 'SUPER_ADMIN' });
    }

    return {
      hosts: [...hosts.values()],
      canSetUp: !own && meetsRole(user.effectiveRoles ?? [], Role.PASTOR),
    };
  }

  /** A pastor (or the Super Admin) turns One-on-One on for themself, with the two default session lengths. */
  async setUpMyHost(user: AuthUser) {
    if (!user.profileId) throw new ForbiddenException('No profile');
    const existing = await this.prisma.pastorHost.findFirst({ where: { tenantId: this.tenantId, profileId: user.profileId } });
    if (existing) throw new ConflictException('One-on-One is already set up for you');

    const member = await this.prisma.member.findFirst({ where: { profileId: user.profileId }, select: { firstName: true, lastName: true } });
    const name = member ? `${member.firstName} ${member.lastName}`.trim() : user.email;
    const position = await this.prisma.pastorHost.count({ where: { tenantId: this.tenantId } });
    const hostId = randomUUID();
    const displayName = `Pastor ${name}`;
    let slug = slugify(displayName) || `pastor-${hostId.slice(0, 6)}`;
    if (await this.prisma.pastorHost.findFirst({ where: { tenantId: this.tenantId, slug } })) slug = `${slug}-${hostId.slice(0, 6)}`;

    await this.prisma.pastorHost.create({
      data: {
        id: hostId,
        tenantId: this.tenantId,
        profileId: user.profileId,
        displayName,
        slug,
        title: user.effectiveRoles?.includes(Role.SUPER_ADMIN) ? 'Senior Pastor' : 'Pastor',
        position,
        SessionTypes: {
          create: DEFAULT_SESSION_TYPES.map((t) => ({ id: randomUUID(), tenantId: this.tenantId, slug: slugify(t.name), ...t })),
        },
      },
    });
    return this.getHostDetail(user, hostId);
  }

  async getHostDetail(user: AuthUser, hostId: string) {
    const { isOwner } = await this.assertCanManage(user, hostId);
    const host = await this.prisma.pastorHost.findFirstOrThrow({
      where: { id: hostId },
      include: {
        Rules: { orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] },
        Blocks: { where: { date: { gte: new Date(`${localDateKey(new Date())}T00:00:00.000Z`) } }, orderBy: { date: 'asc' } },
        SessionTypes: { where: { archivedAt: null }, orderBy: { position: 'asc' } },
        Delegates: { include: { Delegate: { include: { Member: { select: { firstName: true, lastName: true, email: true } } } } } },
      },
    });

    return {
      id: host.id,
      displayName: host.displayName,
      slug: host.slug,
      defaultMeetingLink: host.defaultMeetingLink,
      publicIntake: host.publicIntake,
      canSetPublicIntake: this.isSuperAdmin(user),
      googleConnected: await this.calendar.isConnected(host.profileId),
      notesEnabled: this.notesEnabled,
      title: host.title,
      bio: host.bio,
      active: host.active,
      bufferMinutes: host.bufferMinutes,
      dailyCap: host.dailyCap,
      minNoticeHours: host.minNoticeHours,
      horizonDays: host.horizonDays,
      visitorsAllowed: host.visitorsAllowed,
      visitorWeeklyCap: host.visitorWeeklyCap,
      canAppointDelegates: isOwner || this.isSuperAdmin(user),
      rules: host.Rules.map((r) => ({ id: r.id, weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
      blocks: host.Blocks.map((b) => ({ id: b.id, date: b.date.toISOString().slice(0, 10), note: b.note })),
      sessionTypes: host.SessionTypes.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        description: t.description,
        durationMinutes: t.durationMinutes,
        visitorsCanBook: t.visitorsCanBook,
        askTopic: t.askTopic,
        jointWithHostId: t.jointWithHostId,
        active: t.active,
      })),
      delegates: host.Delegates.map((d) => ({
        id: d.id,
        profileId: d.delegateProfileId,
        name: d.Delegate.Member ? `${d.Delegate.Member.firstName} ${d.Delegate.Member.lastName}`.trim() : 'Unnamed account',
        email: d.Delegate.Member?.email ?? null,
      })),
    };
  }

  // ── Manage: settings, hours, days off, session types ──────────────────────

  async updateSettings(user: AuthUser, hostId: string, input: UpdateHostSettingsDto) {
    await this.assertCanManage(user, hostId);
    const { publicIntake, ...dto } = input;
    if (publicIntake !== undefined) {
      if (!this.isSuperAdmin(user)) throw new ForbiddenException('Only the Super Admin chooses who receives public requests');
      // One pastor receives the nameless page's requests at a time.
      await this.prisma.$transaction([
        ...(publicIntake
          ? [this.prisma.pastorHost.updateMany({ where: { tenantId: this.tenantId, id: { not: hostId } }, data: { publicIntake: false } })]
          : []),
        this.prisma.pastorHost.update({ where: { id: hostId }, data: { publicIntake } }),
      ]);
    }
    const slug = dto.slug !== undefined ? slugify(dto.slug) : undefined;
    if (slug !== undefined && !SLUG.test(slug)) throw new BadRequestException('Use letters, numbers and dashes for the link');
    if (slug === 'request') throw new BadRequestException('That link name is reserved. Try another.');
    try {
      await this.prisma.pastorHost.update({
        where: { id: hostId },
        data: {
          ...dto,
          ...(slug !== undefined && { slug }),
          ...(dto.displayName !== undefined && { displayName: dto.displayName.trim() }),
          ...(dto.title !== undefined && { title: dto.title.trim() || null }),
          ...(dto.bio !== undefined && { bio: dto.bio.trim() || null }),
          ...(dto.defaultMeetingLink !== undefined && { defaultMeetingLink: dto.defaultMeetingLink.trim() || null }),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('That link is already taken. Try another.');
      }
      throw err;
    }
    return this.getHostDetail(user, hostId);
  }

  /** Replaces the whole weekly pattern at once, which is how the editor saves it. */
  async replaceRules(user: AuthUser, hostId: string, dto: ReplaceRulesDto) {
    await this.assertCanManage(user, hostId);

    const byDay = new Map<number, { start: number; end: number }[]>();
    for (const r of dto.rules) {
      const start = parseHhmm(r.startTime);
      const end = parseHhmm(r.endTime);
      if (start >= end) throw new BadRequestException(`A time range on day ${r.weekday} ends before it starts`);
      const list = byDay.get(r.weekday) ?? [];
      if (list.some((x) => start < x.end && end > x.start)) {
        throw new BadRequestException('Two time ranges on the same day overlap');
      }
      list.push({ start, end });
      byDay.set(r.weekday, list);
    }

    await this.prisma.$transaction([
      this.prisma.pastorAvailabilityRule.deleteMany({ where: { hostId } }),
      this.prisma.pastorAvailabilityRule.createMany({
        data: dto.rules.map((r) => ({ id: randomUUID(), tenantId: this.tenantId, hostId, weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
      }),
    ]);
    return this.getHostDetail(user, hostId);
  }

  async addBlock(user: AuthUser, hostId: string, dto: CreateBlockDto) {
    await this.assertCanManage(user, hostId);
    try {
      await this.prisma.pastorAvailabilityBlock.create({
        data: { id: randomUUID(), tenantId: this.tenantId, hostId, date: new Date(`${dto.date}T00:00:00.000Z`), note: dto.note?.trim() || null },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('That day is already blocked');
      }
      throw err;
    }
    return this.getHostDetail(user, hostId);
  }

  async removeBlock(user: AuthUser, hostId: string, blockId: string) {
    await this.assertCanManage(user, hostId);
    const result = await this.prisma.pastorAvailabilityBlock.deleteMany({ where: { id: blockId, hostId } });
    if (result.count === 0) throw new NotFoundException('Blocked day not found');
    return this.getHostDetail(user, hostId);
  }

  async createSessionType(user: AuthUser, hostId: string, dto: CreateSessionTypeDto) {
    await this.assertCanManage(user, hostId);
    if (dto.jointWithHostId) {
      if (dto.jointWithHostId === hostId) throw new BadRequestException('Choose the other pastor for a joint session');
      await this.loadHost(dto.jointWithHostId);
    }
    const position = await this.prisma.pastorSessionType.count({ where: { hostId } });
    const id = randomUUID();
    let slug = slugify(dto.name) || `session-${id.slice(0, 6)}`;
    if (await this.prisma.pastorSessionType.findFirst({ where: { hostId, slug } })) slug = `${slug}-${id.slice(0, 6)}`;
    await this.prisma.pastorSessionType.create({
      data: {
        id,
        tenantId: this.tenantId,
        hostId,
        slug,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        durationMinutes: dto.durationMinutes,
        visitorsCanBook: dto.visitorsCanBook ?? false,
        askTopic: dto.askTopic ?? true,
        jointWithHostId: dto.jointWithHostId ?? null,
        position,
      },
    });
    return this.getHostDetail(user, hostId);
  }

  async updateSessionType(user: AuthUser, hostId: string, typeId: string, dto: UpdateSessionTypeDto) {
    await this.assertCanManage(user, hostId);
    const result = await this.prisma.pastorSessionType.updateMany({
      where: { id: typeId, hostId },
      data: {
        ...dto,
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description.trim() || null }),
      },
    });
    if (result.count === 0) throw new NotFoundException('Session type not found');
    return this.getHostDetail(user, hostId);
  }

  /**
   * Deletes a session type. One that has ever been requested is archived
   * instead: hidden everywhere, but its past sessions keep their history.
   */
  async deleteSessionType(user: AuthUser, hostId: string, typeId: string) {
    await this.assertCanManage(user, hostId);
    const type = await this.prisma.pastorSessionType.findFirst({ where: { id: typeId, hostId, archivedAt: null } });
    if (!type) throw new NotFoundException('Session type not found');

    const open = await this.prisma.pastoralBooking.count({
      where: { sessionTypeId: typeId, status: { in: ACTIVE_STATUSES }, endsAt: { gt: new Date() } },
    });
    if (open > 0) {
      throw new ConflictException(
        `${open === 1 ? 'One request or session is' : `${open} requests or sessions are`} still open for this session type. Decide or cancel ${open === 1 ? 'it' : 'them'} first, or just switch it off.`,
      );
    }

    const used = await this.prisma.pastoralBooking.count({ where: { sessionTypeId: typeId } });
    if (used > 0) {
      await this.prisma.pastorSessionType.update({ where: { id: typeId }, data: { archivedAt: new Date(), active: false } });
    } else {
      await this.prisma.pastorSessionType.delete({ where: { id: typeId } });
    }
    return this.getHostDetail(user, hostId);
  }

  // ── Manage: delegates ─────────────────────────────────────────────────────

  /** People a pastor might appoint, by name or email. Only shown to those who can appoint. */
  async searchPeople(user: AuthUser, q: string) {
    const own = await this.prisma.pastorHost.findFirst({ where: { tenantId: this.tenantId, profileId: user.profileId ?? '' } });
    if (!own && !this.isSuperAdmin(user)) throw new ForbiddenException('Only pastors can search for delegates');
    const term = q.trim();
    if (term.length < 2) return [];

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: { profileId: true, firstName: true, lastName: true, email: true },
      take: 10,
      orderBy: { firstName: 'asc' },
    });
    return members.map((m) => ({ profileId: m.profileId, name: `${m.firstName} ${m.lastName}`.trim(), email: m.email }));
  }

  async addDelegate(user: AuthUser, hostId: string, dto: AddDelegateDto) {
    const host = await this.assertCanAppoint(user, hostId);
    if (dto.profileId === host.profileId) throw new BadRequestException("A pastor can't be their own delegate");
    const profile = await this.prisma.profile.findFirst({ where: { id: dto.profileId, tenantId: this.tenantId } });
    if (!profile) throw new NotFoundException('Person not found');

    try {
      await this.prisma.pastorDelegate.create({
        data: { id: randomUUID(), tenantId: this.tenantId, hostId, delegateProfileId: dto.profileId, appointedById: user.profileId ?? '' },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Already a delegate');
      }
      throw err;
    }
    return this.getHostDetail(user, hostId);
  }

  async removeDelegate(user: AuthUser, hostId: string, delegateId: string) {
    await this.assertCanAppoint(user, hostId);
    const result = await this.prisma.pastorDelegate.deleteMany({ where: { id: delegateId, hostId } });
    if (result.count === 0) throw new NotFoundException('Delegate not found');
    return this.getHostDetail(user, hostId);
  }


  // ── Open times ────────────────────────────────────────────────────────────

  /** Pastors taking requests from this audience, each with their session types, share link and next opening. */
  async listHosts(audience: Audience = 'MEMBER') {
    const hosts = await this.prisma.pastorHost.findMany({
      where: { tenantId: this.tenantId, active: true, ...(audience === 'VISITOR' && { visitorsAllowed: true }) },
      include: {
        SessionTypes: {
          where: { active: true, archivedAt: null, ...(audience === 'VISITOR' && { visitorsCanBook: true, jointWithHostId: null }) },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    const today = localDateKey(new Date());
    return Promise.all(
      hosts
        .filter((h) => h.SessionTypes.length > 0)
        .map(async (h) => {
          const first = h.SessionTypes[0];
          const days = await this.computeOpenSlots(h.id, first.id, today, addDaysToKey(today, Math.min(h.horizonDays, MAX_RANGE_DAYS)), { audience });
          const next = days[0]?.slots[0] ?? null;
          return {
            id: h.id,
            slug: h.slug,
            displayName: h.displayName,
            title: h.title,
            bio: h.bio,
            sessionTypes: h.SessionTypes.map((t) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              description: t.description,
              durationMinutes: t.durationMinutes,
              joint: Boolean(t.jointWithHostId),
              askTopic: t.askTopic,
            })),
            nextOpening: next?.startsAt ?? null,
            notesEnabled: this.notesEnabled,
          };
        }),
    );
  }

  /**
   * What the general public page offers: the receiving pastor's visitor
   * sessions and open times, with nothing that names them. Null when no one
   * is receiving public requests.
   */
  async getPublicIntake() {
    const intake = await this.prisma.pastorHost.findFirst({
      where: { tenantId: this.tenantId, publicIntake: true, active: true, visitorsAllowed: true },
      select: { id: true },
    });
    if (!intake) return null;
    const host = (await this.listHosts('VISITOR')).find((h) => h.id === intake.id);
    if (!host) return null;
    return { ...host, displayName: 'One of our pastors', slug: null, title: null, bio: null };
  }

  async getSlots(hostId: string, query: SlotsQueryDto, audience: Audience = 'MEMBER'): Promise<SlotDay[]> {
    if (query.to < query.from) throw new BadRequestException('"to" is before "from"');
    if (addDaysToKey(query.from, MAX_RANGE_DAYS) < query.to) throw new BadRequestException('Ask for at most two months at a time');
    const host = await this.loadHost(hostId);
    if (!host.active || (audience === 'VISITOR' && !host.visitorsAllowed)) throw new NotFoundException('Pastor not found');
    return this.computeOpenSlots(hostId, query.sessionTypeId, query.from, query.to, { audience });
  }

  /** The pastor's own preview of what members will see. */
  async previewSlots(user: AuthUser, hostId: string, query: SlotsQueryDto): Promise<SlotDay[]> {
    await this.assertCanManage(user, hostId);
    if (addDaysToKey(query.from, MAX_RANGE_DAYS) < query.to) throw new BadRequestException('Ask for at most two months at a time');
    return this.computeOpenSlots(hostId, query.sessionTypeId, query.from, query.to);
  }

  /** Busy times from the Google Calendars of everyone hosting this session type. */
  async externalBusyFor(hostId: string, sessionTypeId: string, from: string, to: string): Promise<BusyInterval[]> {
    const type = await this.prisma.pastorSessionType.findFirst({ where: { id: sessionTypeId, hostId } });
    const hostIds = type?.jointWithHostId ? [hostId, type.jointWithHostId] : [hostId];
    const hosts = await this.prisma.pastorHost.findMany({ where: { id: { in: hostIds } }, select: { profileId: true } });
    const start = wallTime(from, 0);
    const end = wallTime(addDaysToKey(to, 1), 0);
    const all = await Promise.all(hosts.map((h) => this.calendar.busy(h.profileId, start, end)));
    return all.flat();
  }

  /**
   * Open times for a session type. Pass a transaction client to re-check a
   * time atomically before saving, `excludeBookingId` when moving a request so
   * its own current time doesn't count against it, and `externalBusy` to reuse
   * Google busy times fetched outside the transaction.
   */
  async computeOpenSlots(
    hostId: string,
    sessionTypeId: string,
    from: string,
    to: string,
    opts: { db?: Db; excludeBookingId?: string; externalBusy?: BusyInterval[]; audience?: Audience } = {},
  ): Promise<SlotDay[]> {
    const db = opts.db ?? this.prisma;
    const audience = opts.audience ?? 'MEMBER';
    const type = await db.pastorSessionType.findFirst({ where: { id: sessionTypeId, hostId, active: true } });
    if (!type) throw new NotFoundException('Session type not found');
    if (audience === 'VISITOR' && (!type.visitorsCanBook || type.jointWithHostId)) throw new NotFoundException('Session type not found');

    const hostIds = type.jointWithHostId ? [hostId, type.jointWithHostId] : [hostId];
    const hosts: HostWithRules[] = await db.pastorHost.findMany({
      where: { id: { in: hostIds }, tenantId: this.tenantId },
      include: { Rules: true, Blocks: true },
    });
    if (hosts.length !== hostIds.length) throw new NotFoundException('Pastor not found');

    const rules = hosts
      .map((h) => h.Rules.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })))
      .reduce((acc, next) => intersectWindows(acc, next));
    const now = new Date();
    const { busy, sessionsPerDay, visitorsPerWeek } = await this.loadBusy(db, hostIds, from, to, now, opts.excludeBookingId);
    const external = opts.externalBusy ?? (await this.externalBusyFor(hostId, sessionTypeId, from, to));

    const days = computeSlots({
      rules,
      blockedDates: hosts.flatMap((h) => h.Blocks.map((b) => b.date.toISOString().slice(0, 10))),
      busy: [...busy, ...external],
      sessionsPerDay,
      durationMinutes: type.durationMinutes,
      bufferMinutes: Math.max(...hosts.map((h) => h.bufferMinutes)),
      dailyCap: Math.min(...hosts.map((h) => h.dailyCap)),
      minNoticeHours: Math.max(...hosts.map((h) => h.minNoticeHours)),
      horizonDays: Math.min(...hosts.map((h) => h.horizonDays)),
      from,
      to,
      now,
    });

    // A pastor caps how many visitor sessions they take a week; a full week shows no times to visitors.
    const visitorCap = hosts[0].visitorWeeklyCap;
    return Object.entries(days)
      .filter(([date]) => audience !== 'VISITOR' || (visitorsPerWeek[weekOf(date)] ?? 0) < visitorCap)
      .map(([date, slots]) => ({
        date,
        slots: slots.map((s) => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() })),
      }));
  }

  /** Time already taken by sessions involving any of these pastors, how many each day holds, and visitor sessions per week. */
  private async loadBusy(db: Db, hostIds: string[], from: string, to: string, now: Date, excludeBookingId?: string) {
    const rangeStart = new Date(`${addDaysToKey(weekOf(from), -1)}T00:00:00.000Z`);
    const rangeEnd = new Date(`${addDaysToKey(to, 8)}T00:00:00.000Z`);
    const bookings = await db.pastoralBooking.findMany({
      where: {
        tenantId: this.tenantId,
        status: { in: ACTIVE_STATUSES },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        AND: [
          { OR: [{ hostId: { in: hostIds } }, { coHostId: { in: hostIds } }] },
          {
            OR: [
              { startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } },
              { proposedStartsAt: { lt: rangeEnd }, proposedEndsAt: { gt: rangeStart } },
            ],
          },
        ],
      },
      select: {
        status: true,
        requesterType: true,
        startsAt: true,
        endsAt: true,
        holdExpiresAt: true,
        proposedStartsAt: true,
        proposedEndsAt: true,
      },
    });

    const busy: BusyInterval[] = [];
    const sessionsPerDay: Record<string, number> = {};
    const visitorsPerWeek: Record<string, number> = {};
    for (const b of bookings) {
      if (b.status === PastoralBookingStatus.HOLD && (!b.holdExpiresAt || b.holdExpiresAt <= now)) continue;
      const interval =
        b.status === PastoralBookingStatus.PROPOSED && b.proposedStartsAt && b.proposedEndsAt
          ? { start: b.proposedStartsAt, end: b.proposedEndsAt }
          : { start: b.startsAt, end: b.endsAt };
      busy.push(interval);
      const day = localDateKey(interval.start);
      sessionsPerDay[day] = (sessionsPerDay[day] ?? 0) + 1;
      if (b.requesterType === PastoralRequesterType.VISITOR) {
        const week = weekOf(day);
        visitorsPerWeek[week] = (visitorsPerWeek[week] ?? 0) + 1;
      }
    }
    return { busy, sessionsPerDay, visitorsPerWeek };
  }
}
