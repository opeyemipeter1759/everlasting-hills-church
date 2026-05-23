import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

async function computeForMember(memberId: string) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [totalServices, attended, memberData] = await Promise.all([
    db.service.count({
      where: { tenantId: TENANT_ID, scheduledAt: { gte: ninetyDaysAgo } },
    }),
    db.attendanceRecord.count({
      where: {
        tenantId: TENANT_ID,
        memberId,
        present: true,
        service: { scheduledAt: { gte: ninetyDaysAgo } },
      },
    }),
    db.member.findUnique({ where: { id: memberId }, select: { email: true } }),
  ]);

  const attendancePct = totalServices > 0 ? attended / totalServices : 0;
  const attendanceScore = Math.round(Math.min(attendancePct * 40, 40));

  const [sermonPlays, bookmarks, reactions, notes] = await Promise.all([
    db.listenProgress.count({
      where: {
        tenantId: TENANT_ID,
        memberId,
        positionSec: { gt: 0 },
        updatedAt: { gte: ninetyDaysAgo },
      },
    }),
    db.sermonBookmark.count({
      where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } },
    }),
    db.sermonReaction.count({
      where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } },
    }),
    db.sermonNote.count({
      where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } },
    }),
  ]);
  const sermonScore = Math.min(sermonPlays * 3 + bookmarks * 5 + reactions * 2 + notes * 4, 30);

  let givingCount = 0;
  if (memberData?.email) {
    givingCount = await db.givingRecord.count({
      where: {
        tenantId: TENANT_ID,
        paystackStatus: "success",
        donorEmail: memberData.email,
        createdAt: { gte: ninetyDaysAgo },
      },
    });
  }
  const givingScore = Math.min(givingCount * 5, 20);

  const responses = await db.discussionResponse.count({
    where: { tenantId: TENANT_ID, memberId, createdAt: { gte: ninetyDaysAgo } },
  });
  const communityScore = Math.min(responses * 5, 10);

  const score = attendanceScore + sermonScore + givingScore + communityScore;
  return { memberId, score, attendanceScore, sermonScore, givingScore, communityScore };
}

export async function refreshEngagementScores() {
  const members = await db.member.findMany({
    where: { tenantId: TENANT_ID, status: "ACTIVE" },
    select: { id: true },
  });

  const results = await Promise.all(members.map((m) => computeForMember(m.id)));

  await Promise.all(
    results.map((r) =>
      db.engagementScore.upsert({
        where: { memberId: r.memberId },
        update: {
          score: r.score,
          attendanceScore: r.attendanceScore,
          sermonScore: r.sermonScore,
          givingScore: r.givingScore,
          communityScore: r.communityScore,
          computedAt: new Date(),
        },
        create: {
          tenantId: TENANT_ID,
          memberId: r.memberId,
          score: r.score,
          attendanceScore: r.attendanceScore,
          sermonScore: r.sermonScore,
          givingScore: r.givingScore,
          communityScore: r.communityScore,
        },
      })
    )
  );

  return results;
}

export async function getEngagementLeaderboard(limit = 25) {
  const scores = await db.engagementScore.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { score: "desc" },
    take: limit,
    include: {
      member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });
  return scores.map((s) => ({
    memberId: s.memberId,
    name: `${s.member.firstName} ${s.member.lastName}`,
    photoUrl: s.member.photoUrl,
    score: s.score,
    attendanceScore: s.attendanceScore,
    sermonScore: s.sermonScore,
    givingScore: s.givingScore,
    communityScore: s.communityScore,
    computedAt: s.computedAt.toISOString(),
  }));
}

export async function getAtRiskMembers() {
  const scores = await db.engagementScore.findMany({
    where: { tenantId: TENANT_ID, score: { lt: 30 } },
    orderBy: { score: "asc" },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          photoUrl: true,
        },
      },
    },
  });
  return scores.map((s) => ({
    memberId: s.memberId,
    name: `${s.member.firstName} ${s.member.lastName}`,
    email: s.member.email,
    phone: s.member.phone,
    photoUrl: s.member.photoUrl,
    score: s.score,
  }));
}

export async function getEngagementDistribution() {
  const [high, medHigh, med, low] = await Promise.all([
    db.engagementScore.count({ where: { tenantId: TENANT_ID, score: { gte: 70 } } }),
    db.engagementScore.count({ where: { tenantId: TENANT_ID, score: { gte: 50, lt: 70 } } }),
    db.engagementScore.count({ where: { tenantId: TENANT_ID, score: { gte: 30, lt: 50 } } }),
    db.engagementScore.count({ where: { tenantId: TENANT_ID, score: { lt: 30 } } }),
  ]);
  return [
    { label: "Highly Engaged", range: "70–100", value: high, color: "bg-green-500" },
    { label: "Engaged", range: "50–69", value: medHigh, color: "bg-blue-500" },
    { label: "Needs Attention", range: "30–49", value: med, color: "bg-yellow-500" },
    { label: "At Risk", range: "0–29", value: low, color: "bg-red-500" },
  ];
}

export async function getEngagementSummary() {
  const [total, scored, avgResult] = await Promise.all([
    db.member.count({ where: { tenantId: TENANT_ID, status: "ACTIVE" } }),
    db.engagementScore.count({ where: { tenantId: TENANT_ID } }),
    db.engagementScore.aggregate({
      where: { tenantId: TENANT_ID },
      _avg: { score: true },
    }),
  ]);
  return {
    totalMembers: total,
    scoredMembers: scored,
    avgScore: Math.round(avgResult._avg.score ?? 0),
    unscored: total - scored,
  };
}

export type EngagementLeaderboard = Awaited<ReturnType<typeof getEngagementLeaderboard>>;
