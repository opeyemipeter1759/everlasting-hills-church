import { db } from "@/lib/db/prisma";
import { SermonStatus } from "@prisma/client";
import slugify from "slugify";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

function makeSlug(title: string, date: string | Date): string {
  const d = new Date(date);
  const suffix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return slugify(`${title}-${suffix}`, { lower: true, strict: true });
}

// ── Admin Queries ─────────────────────────────────────────────────────────────

export async function getAllSermons(opts?: { status?: SermonStatus; series?: string }) {
  return db.sermon.findMany({
    where: {
      tenantId: TENANT_ID,
      ...(opts?.status && { status: opts.status }),
      ...(opts?.series && { seriesSlug: opts.series }),
    },
    orderBy: { date: "desc" },
    include: {
      _count: { select: { reactions: true, bookmarks: true } },
    },
  });
}

export async function getSermonById(id: string) {
  return db.sermon.findUnique({
    where: { id },
    include: {
      discussion: { orderBy: { order: "asc" } },
      _count: { select: { reactions: true, bookmarks: true } },
    },
  });
}

export async function createSermon(data: {
  title: string;
  speaker: string;
  date: string;
  description?: string;
  transcript?: string;
  scriptureRef?: string;
  series?: string;
  tags?: string[];
  audioUrl?: string;
  audioKey?: string;
  audioDuration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  status?: SermonStatus;
  scheduledFor?: string;
}) {
  const slug = makeSlug(data.title, data.date);
  return db.sermon.create({
    data: {
      tenantId: TENANT_ID,
      title: data.title,
      slug,
      speaker: data.speaker,
      date: new Date(data.date),
      description: data.description,
      transcript: data.transcript,
      scriptureRef: data.scriptureRef,
      series: data.series,
      seriesSlug: data.series ? slugify(data.series, { lower: true, strict: true }) : null,
      tags: data.tags ?? [],
      audioUrl: data.audioUrl,
      audioKey: data.audioKey,
      audioDuration: data.audioDuration,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      status: data.status ?? SermonStatus.DRAFT,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      publishedAt: data.status === SermonStatus.PUBLISHED ? new Date() : null,
    },
  });
}

export async function updateSermon(id: string, data: Partial<{
  title: string;
  speaker: string;
  date: string;
  description: string;
  transcript: string;
  scriptureRef: string;
  series: string;
  tags: string[];
  audioUrl: string;
  audioKey: string;
  audioDuration: number;
  videoUrl: string;
  thumbnailUrl: string;
  status: SermonStatus;
  scheduledFor: string;
  isFeatured: boolean;
}>) {
  const current = await db.sermon.findUnique({ where: { id } });
  const nowPublishing =
    data.status === SermonStatus.PUBLISHED && current?.status !== SermonStatus.PUBLISHED;

  return db.sermon.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title, slug: makeSlug(data.title, data.date ?? current?.date ?? new Date()) }),
      ...(data.speaker && { speaker: data.speaker }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.transcript !== undefined && { transcript: data.transcript }),
      ...(data.scriptureRef !== undefined && { scriptureRef: data.scriptureRef }),
      ...(data.series !== undefined && {
        series: data.series,
        seriesSlug: data.series ? slugify(data.series, { lower: true, strict: true }) : null,
      }),
      ...(data.tags && { tags: data.tags }),
      ...(data.audioUrl !== undefined && { audioUrl: data.audioUrl }),
      ...(data.audioKey !== undefined && { audioKey: data.audioKey }),
      ...(data.audioDuration !== undefined && { audioDuration: data.audioDuration }),
      ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
      ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
      ...(data.status && { status: data.status }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.scheduledFor !== undefined && {
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      }),
      ...(nowPublishing && { publishedAt: new Date() }),
    },
  });
}

export async function deleteSermon(id: string) {
  return db.sermon.delete({ where: { id } });
}

export async function setFeaturedSermon(id: string) {
  await db.sermon.updateMany({ where: { tenantId: TENANT_ID }, data: { isFeatured: false } });
  return db.sermon.update({ where: { id }, data: { isFeatured: true } });
}

// ── Public Queries ────────────────────────────────────────────────────────────

export async function getPublishedSermons(opts?: { series?: string; search?: string; limit?: number }) {
  return db.sermon.findMany({
    where: {
      tenantId: TENANT_ID,
      status: SermonStatus.PUBLISHED,
      ...(opts?.series && { seriesSlug: opts.series }),
      ...(opts?.search && {
        OR: [
          { title: { contains: opts.search, mode: "insensitive" } },
          { speaker: { contains: opts.search, mode: "insensitive" } },
          { scriptureRef: { contains: opts.search, mode: "insensitive" } },
          { series: { contains: opts.search, mode: "insensitive" } },
          { description: { contains: opts.search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { date: "desc" },
    take: opts?.limit,
    include: {
      _count: { select: { reactions: true, bookmarks: true } },
    },
  });
}

export async function getSermonBySlug(slug: string) {
  return db.sermon.findUnique({
    where: { slug },
    include: {
      discussion: {
        orderBy: { order: "asc" },
        include: { responses: { include: { member: { select: { firstName: true, lastName: true, photoUrl: true } } } } },
      },
      _count: { select: { reactions: true, bookmarks: true } },
    },
  });
}

export async function getFeaturedSermon() {
  return db.sermon.findFirst({
    where: { tenantId: TENANT_ID, status: SermonStatus.PUBLISHED, isFeatured: true },
  });
}

export async function getLatestSermons(limit = 3) {
  return db.sermon.findMany({
    where: { tenantId: TENANT_ID, status: SermonStatus.PUBLISHED },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getSeriesList() {
  const sermons = await db.sermon.findMany({
    where: { tenantId: TENANT_ID, status: SermonStatus.PUBLISHED, series: { not: null } },
    select: { series: true, seriesSlug: true, date: true },
    distinct: ["seriesSlug"],
    orderBy: { date: "desc" },
  });
  return sermons.filter((s) => s.series && s.seriesSlug);
}

export async function incrementPlayCount(id: string) {
  return db.sermon.update({ where: { id }, data: { playCount: { increment: 1 } } });
}

// ── Member Features ───────────────────────────────────────────────────────────

export async function getMemberContext(userId: string, sermonId: string) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) return null;
  const member = await db.member.findUnique({ where: { profileId: profile.id } });
  if (!member) return null;

  const [reaction, bookmark, note, progress] = await Promise.all([
    db.sermonReaction.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
    db.sermonBookmark.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
    db.sermonNote.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
    db.listenProgress.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
  ]);

  return { memberId: member.id, reaction, bookmark, note, progress };
}

export async function upsertReaction(memberId: string, sermonId: string, type: string) {
  const existing = await db.sermonReaction.findUnique({
    where: { sermonId_memberId: { sermonId, memberId } },
  });
  if (existing?.type === type) {
    await db.sermonReaction.delete({ where: { sermonId_memberId: { sermonId, memberId } } });
    return null;
  }
  return db.sermonReaction.upsert({
    where: { sermonId_memberId: { sermonId, memberId } },
    create: { tenantId: TENANT_ID, sermonId, memberId, type },
    update: { type },
  });
}

export async function toggleBookmark(memberId: string, sermonId: string) {
  const existing = await db.sermonBookmark.findUnique({
    where: { sermonId_memberId: { sermonId, memberId } },
  });
  if (existing) {
    await db.sermonBookmark.delete({ where: { sermonId_memberId: { sermonId, memberId } } });
    return false;
  }
  await db.sermonBookmark.create({ data: { tenantId: TENANT_ID, sermonId, memberId } });
  return true;
}

export async function upsertNote(memberId: string, sermonId: string, content: string) {
  return db.sermonNote.upsert({
    where: { sermonId_memberId: { sermonId, memberId } },
    create: { tenantId: TENANT_ID, sermonId, memberId, content },
    update: { content },
  });
}

export async function saveProgress(memberId: string, sermonId: string, positionSec: number, completed = false) {
  return db.listenProgress.upsert({
    where: { sermonId_memberId: { sermonId, memberId } },
    create: { tenantId: TENANT_ID, sermonId, memberId, positionSec, completed },
    update: { positionSec, completed: completed || undefined },
  });
}

export async function getMemberBookmarks(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) return [];
  const member = await db.member.findUnique({ where: { profileId: profile.id } });
  if (!member) return [];

  return db.sermonBookmark.findMany({
    where: { memberId: member.id },
    include: { sermon: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMemberListenHistory(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) return [];
  const member = await db.member.findUnique({ where: { profileId: profile.id } });
  if (!member) return [];

  return db.listenProgress.findMany({
    where: { memberId: member.id, positionSec: { gt: 0 } },
    include: { sermon: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
}

export async function getSermonStreak(userId: string): Promise<number> {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) return 0;
  const member = await db.member.findUnique({ where: { profileId: profile.id } });
  if (!member) return 0;

  const progress = await db.listenProgress.findMany({
    where: { memberId: member.id, completed: true },
    include: { sermon: { select: { date: true } } },
    orderBy: { sermon: { date: "desc" } },
  });
  if (!progress.length) return 0;

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const weekStarts = new Set<number>();
  for (const p of progress) {
    const d = new Date(p.sermon.date);
    d.setHours(0, 0, 0, 0);
    const ws = new Date(d.getTime() - d.getDay() * 86400000);
    weekStarts.add(ws.getTime());
  }
  const sorted = Array.from(weekStarts).sort((a, b) => b - a);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentWS = new Date(now.getTime() - now.getDay() * 86400000);
  if (sorted[0] < currentWS.getTime() - MS_PER_WEEK) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] - sorted[i] === MS_PER_WEEK) streak++;
    else break;
  }
  return streak;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getSermonAnalytics() {
  const [sermons, totalSubscribers, totalReactions, totalBookmarks, totalListens] = await Promise.all([
    db.sermon.findMany({
      where: { tenantId: TENANT_ID, status: SermonStatus.PUBLISHED },
      orderBy: { playCount: "desc" },
      take: 10,
      select: {
        id: true, title: true, slug: true, speaker: true, date: true,
        playCount: true, series: true,
        _count: { select: { reactions: true, bookmarks: true } },
      },
    }),
    db.emailSubscriber.count({ where: { tenantId: TENANT_ID } }),
    db.sermonReaction.count({ where: { tenantId: TENANT_ID } }),
    db.sermonBookmark.count({ where: { tenantId: TENANT_ID } }),
    db.listenProgress.count({ where: { tenantId: TENANT_ID, positionSec: { gt: 0 } } }),
  ]);

  return { sermons, totalSubscribers, totalReactions, totalBookmarks, totalListens };
}

// ── Email Subscribers ─────────────────────────────────────────────────────────

export async function subscribeEmail(email: string) {
  return db.emailSubscriber.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email } },
    create: { tenantId: TENANT_ID, email },
    update: {},
  });
}

export async function getSubscribers() {
  return db.emailSubscriber.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { subscribedAt: "desc" },
  });
}

// ── Cron: publish scheduled sermons ──────────────────────────────────────────

export async function publishScheduledSermons() {
  return db.sermon.updateMany({
    where: {
      tenantId: TENANT_ID,
      status: SermonStatus.SCHEDULED,
      scheduledFor: { lte: new Date() },
    },
    data: { status: SermonStatus.PUBLISHED, publishedAt: new Date() },
  });
}
