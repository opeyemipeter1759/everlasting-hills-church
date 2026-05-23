import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function getAttendanceTrend(limit = 16) {
  const services = await db.service.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { scheduledAt: "desc" },
    take: limit,
    include: { _count: { select: { attendance: { where: { present: true } } } } },
  });
  return [...services].reverse().map((s) => ({
    id: s.id,
    name: s.name,
    date: s.scheduledAt.toISOString(),
    label: s.scheduledAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    count: s._count.attendance,
  }));
}

export async function getAttendanceByDayOfWeek() {
  const services = await db.service.findMany({
    where: { tenantId: TENANT_ID },
    include: { _count: { select: { attendance: { where: { present: true } } } } },
  });
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  services.forEach((s) => {
    const dow = new Date(s.scheduledAt).getDay();
    totals[dow] += s._count.attendance;
    counts[dow]++;
  });
  return days.map((label, i) => ({
    label,
    avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    total: totals[i],
  }));
}

export async function getTopAttendees(limit = 10) {
  const records = await db.attendanceRecord.groupBy({
    by: ["memberId"],
    where: { tenantId: TENANT_ID, present: true },
    _count: { _all: true },
    orderBy: { _count: { memberId: "desc" } },
    take: limit,
  });
  const memberIds = records.map((r) => r.memberId);
  const members = await db.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, firstName: true, lastName: true, photoUrl: true },
  });
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  return records.map((r) => ({
    memberId: r.memberId,
    name: memberMap[r.memberId]
      ? `${memberMap[r.memberId].firstName} ${memberMap[r.memberId].lastName}`
      : "Unknown",
    photoUrl: memberMap[r.memberId]?.photoUrl ?? null,
    count: r._count._all,
  }));
}

export async function getAttendanceSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalServices, totalCheckins, thisMonthCheckins, lastMonthCheckins, totalMembers] =
    await Promise.all([
      db.service.count({ where: { tenantId: TENANT_ID } }),
      db.attendanceRecord.count({ where: { tenantId: TENANT_ID, present: true } }),
      db.attendanceRecord.count({
        where: {
          tenantId: TENANT_ID,
          present: true,
          service: { scheduledAt: { gte: monthStart } },
        },
      }),
      db.attendanceRecord.count({
        where: {
          tenantId: TENANT_ID,
          present: true,
          service: { scheduledAt: { gte: lastMonthStart, lt: monthStart } },
        },
      }),
      db.member.count({ where: { tenantId: TENANT_ID, status: "ACTIVE" } }),
    ]);

  const avgAttendance =
    totalServices > 0 ? Math.round(totalCheckins / totalServices) : 0;
  const momChange =
    lastMonthCheckins === 0
      ? 0
      : Math.round(
          ((thisMonthCheckins - lastMonthCheckins) / lastMonthCheckins) * 100
        );

  return {
    totalServices,
    totalCheckins,
    thisMonthCheckins,
    lastMonthCheckins,
    avgAttendance,
    momChange,
    totalMembers,
    attendanceRate:
      totalMembers > 0 ? Math.round((avgAttendance / totalMembers) * 100) : 0,
  };
}

export type AttendanceTrend = Awaited<ReturnType<typeof getAttendanceTrend>>;
export type AttendanceSummary = Awaited<ReturnType<typeof getAttendanceSummary>>;
