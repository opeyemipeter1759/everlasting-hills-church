import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function getMemberGrowthByMonth(months = 12) {
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const beforeWindow = await db.member.count({
    where: { tenantId: TENANT_ID, joinedAt: { lt: windowStart } },
  });

  const result: { label: string; joined: number; cumulative: number }[] = [];
  let cumulative = beforeWindow;

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const joined = await db.member.count({
      where: { tenantId: TENANT_ID, joinedAt: { gte: start, lt: end } },
    });
    cumulative += joined;
    result.push({
      label: start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      joined,
      cumulative,
    });
  }
  return result;
}

export async function getRetentionRate() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const totalActive = await db.member.count({
    where: { tenantId: TENANT_ID, status: "ACTIVE" },
  });

  const retained = await db.attendanceRecord.groupBy({
    by: ["memberId"],
    where: {
      tenantId: TENANT_ID,
      present: true,
      service: { scheduledAt: { gte: thirtyDaysAgo } },
    },
    having: { memberId: { _count: { gte: 2 } } },
    _count: { _all: true },
  });

  const retainedCount = retained.length;
  const retentionRate =
    totalActive > 0 ? Math.round((retainedCount / totalActive) * 100) : 0;

  return { totalActive, retainedCount, retentionRate };
}

export async function getChurnRisk() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [activeMembers, recentAttendees] = await Promise.all([
    db.member.findMany({
      where: { tenantId: TENANT_ID, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
    }),
    db.attendanceRecord.findMany({
      where: {
        tenantId: TENANT_ID,
        present: true,
        service: { scheduledAt: { gte: sixtyDaysAgo } },
      },
      select: { memberId: true },
      distinct: ["memberId"],
    }),
  ]);

  const recentSet = new Set(recentAttendees.map((r) => r.memberId));
  const atRisk = activeMembers.filter((m) => !recentSet.has(m.id));

  return {
    atRiskCount: atRisk.length,
    totalActive: activeMembers.length,
    churnRate:
      activeMembers.length > 0
        ? Math.round((atRisk.length / activeMembers.length) * 100)
        : 0,
    atRiskMembers: atRisk.slice(0, 25),
  };
}

export async function getMemberStatusDistribution() {
  const statuses = await db.member.groupBy({
    by: ["status"],
    where: { tenantId: TENANT_ID },
    _count: { _all: true },
  });
  return statuses.map((s) => ({ status: s.status, count: s._count._all }));
}

export async function getGrowthSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [total, active, thisMonth, lastMonth, thisYear, inactive] = await Promise.all([
    db.member.count({ where: { tenantId: TENANT_ID } }),
    db.member.count({ where: { tenantId: TENANT_ID, status: "ACTIVE" } }),
    db.member.count({ where: { tenantId: TENANT_ID, joinedAt: { gte: monthStart } } }),
    db.member.count({
      where: { tenantId: TENANT_ID, joinedAt: { gte: lastMonthStart, lt: monthStart } },
    }),
    db.member.count({ where: { tenantId: TENANT_ID, joinedAt: { gte: yearStart } } }),
    db.member.count({ where: { tenantId: TENANT_ID, status: "INACTIVE" } }),
  ]);

  const momChange =
    lastMonth === 0 ? 0 : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return { total, active, inactive, thisMonth, lastMonth, thisYear, momChange };
}

export type GrowthSummary = Awaited<ReturnType<typeof getGrowthSummary>>;
export type ChurnRisk = Awaited<ReturnType<typeof getChurnRisk>>;
