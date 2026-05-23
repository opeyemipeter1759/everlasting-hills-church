import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function getGivingTrend(months = 6) {
  const now = new Date();
  const result: { label: string; amountNaira: number; count: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const agg = await db.givingRecord.aggregate({
      where: {
        tenantId: TENANT_ID,
        paystackStatus: "success",
        createdAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });
    result.push({
      label: start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      amountNaira: Math.round((agg._sum.amount ?? 0) / 100),
      count: agg._count._all,
    });
  }
  return result;
}

export async function getGivingByCategory() {
  const records = await db.givingRecord.groupBy({
    by: ["category"],
    where: { tenantId: TENANT_ID, paystackStatus: "success" },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
  });
  return records.map((r) => ({
    category: r.category || "General",
    amountNaira: Math.round((r._sum.amount ?? 0) / 100),
    count: r._count._all,
  }));
}

export async function getGivingSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [totalAll, thisMonth, lastMonth, thisYear, uniqueEmails, anonymous] =
    await Promise.all([
      db.givingRecord.aggregate({
        where: { tenantId: TENANT_ID, paystackStatus: "success" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.givingRecord.aggregate({
        where: {
          tenantId: TENANT_ID,
          paystackStatus: "success",
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      db.givingRecord.aggregate({
        where: {
          tenantId: TENANT_ID,
          paystackStatus: "success",
          createdAt: { gte: lastMonthStart, lt: monthStart },
        },
        _sum: { amount: true },
      }),
      db.givingRecord.aggregate({
        where: {
          tenantId: TENANT_ID,
          paystackStatus: "success",
          createdAt: { gte: yearStart },
        },
        _sum: { amount: true },
      }),
      db.givingRecord.findMany({
        where: {
          tenantId: TENANT_ID,
          paystackStatus: "success",
          donorEmail: { not: null },
        },
        select: { donorEmail: true },
        distinct: ["donorEmail"],
      }),
      db.givingRecord.count({
        where: { tenantId: TENANT_ID, paystackStatus: "success", donorEmail: null },
      }),
    ]);

  const totalNaira = Math.round((totalAll._sum.amount ?? 0) / 100);
  const thisMonthNaira = Math.round((thisMonth._sum.amount ?? 0) / 100);
  const lastMonthNaira = Math.round((lastMonth._sum.amount ?? 0) / 100);
  const thisYearNaira = Math.round((thisYear._sum.amount ?? 0) / 100);
  const totalCount = totalAll._count._all;
  const momChange =
    lastMonthNaira === 0
      ? 0
      : Math.round(((thisMonthNaira - lastMonthNaira) / lastMonthNaira) * 100);
  const anonymousPct = totalCount > 0 ? Math.round((anonymous / totalCount) * 100) : 0;

  return {
    totalNaira,
    thisMonthNaira,
    lastMonthNaira,
    thisYearNaira,
    totalCount,
    momChange,
    uniqueDonors: uniqueEmails.length,
    anonymous,
    anonymousPct,
  };
}

export async function getTopDonors(limit = 10) {
  const records = await db.givingRecord.groupBy({
    by: ["donorEmail", "donorName"],
    where: {
      tenantId: TENANT_ID,
      paystackStatus: "success",
      donorEmail: { not: null },
    },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  return records.map((r) => ({
    name: r.donorName || r.donorEmail || "Unknown",
    email: r.donorEmail,
    amountNaira: Math.round((r._sum.amount ?? 0) / 100),
    count: r._count._all,
  }));
}

export type GivingSummary = Awaited<ReturnType<typeof getGivingSummary>>;
