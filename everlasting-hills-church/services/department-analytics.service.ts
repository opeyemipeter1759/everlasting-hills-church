import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function getDepartmentStats(unitId?: string) {
  const units = await db.unit.findMany({
    where: unitId ? { id: unitId, tenantId: TENANT_ID } : { tenantId: TENANT_ID },
    include: {
      members: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true, status: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  return Promise.all(
    units.map(async (unit) => {
      const memberIds = unit.members.map((um) => um.memberId);
      const activeCount = unit.members.filter((um) => um.member.status === "ACTIVE").length;

      const recentAttendees = await db.attendanceRecord.findMany({
        where: {
          tenantId: TENANT_ID,
          memberId: { in: memberIds },
          present: true,
          service: { scheduledAt: { gte: thirtyDaysAgo } },
        },
        select: { memberId: true },
        distinct: ["memberId"],
      });

      const attendanceRate =
        activeCount > 0 ? Math.round((recentAttendees.length / activeCount) * 100) : 0;

      const lead = unit.members.find((um) => um.isLead);

      return {
        id: unit.id,
        name: unit.name,
        totalMembers: unit._count.members,
        activeMembers: activeCount,
        recentAttendees: recentAttendees.length,
        attendanceRate,
        leadName: lead
          ? `${lead.member.firstName} ${lead.member.lastName}`
          : null,
      };
    })
  );
}

export async function getUnitMemberAttendance(unitId: string, months = 3) {
  const windowStart = new Date(Date.now() - months * 30 * 86400000);

  const [unitMembers, totalServices] = await Promise.all([
    db.unitMember.findMany({
      where: { tenantId: TENANT_ID, unitId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            status: true,
          },
        },
      },
    }),
    db.service.count({
      where: { tenantId: TENANT_ID, scheduledAt: { gte: windowStart } },
    }),
  ]);

  const result = await Promise.all(
    unitMembers.map(async (um) => {
      const attended = await db.attendanceRecord.count({
        where: {
          tenantId: TENANT_ID,
          memberId: um.memberId,
          present: true,
          service: { scheduledAt: { gte: windowStart } },
        },
      });
      return {
        memberId: um.memberId,
        name: `${um.member.firstName} ${um.member.lastName}`,
        photoUrl: um.member.photoUrl,
        isLead: um.isLead,
        status: um.member.status,
        attended,
        total: totalServices,
        rate: totalServices > 0 ? Math.round((attended / totalServices) * 100) : 0,
      };
    })
  );

  return result.sort((a, b) => b.rate - a.rate);
}

export async function getFirstTimerPipeline() {
  const [
    total,
    interestedCount,
    convertedEmails,
    notInterestedCount,
    onlineCount,
    inPersonCount,
  ] = await Promise.all([
    db.visitor.count({ where: { tenantId: TENANT_ID } }),
    db.visitor.count({ where: { tenantId: TENANT_ID, membershipInterest: "Yes" } }),
    db.visitor.findMany({
      where: { tenantId: TENANT_ID, membershipInterest: "Yes", email: { not: null } },
      select: { email: true },
    }),
    db.visitor.count({ where: { tenantId: TENANT_ID, membershipInterest: "No" } }),
    db.visitor.count({
      where: {
        tenantId: TENANT_ID,
        attendanceType: { contains: "online", mode: "insensitive" },
      },
    }),
    db.visitor.count({
      where: {
        tenantId: TENANT_ID,
        attendanceType: { contains: "person", mode: "insensitive" },
      },
    }),
  ]);

  // Check how many interested visitors became members (via email match)
  const interestedEmails = convertedEmails
    .map((v) => v.email)
    .filter(Boolean) as string[];

  let convertedCount = 0;
  if (interestedEmails.length > 0) {
    convertedCount = await db.member.count({
      where: {
        tenantId: TENANT_ID,
        email: { in: interestedEmails },
      },
    });
  }

  const conversionRate =
    interestedCount > 0 ? Math.round((convertedCount / interestedCount) * 100) : 0;
  const interestRate = total > 0 ? Math.round((interestedCount / total) * 100) : 0;

  return {
    total,
    interestedCount,
    convertedCount,
    notInterestedCount,
    undecidedCount: total - interestedCount - notInterestedCount,
    onlineCount,
    inPersonCount,
    conversionRate,
    interestRate,
  };
}

export async function getFirstTimerSources() {
  const visitors = await db.visitor.findMany({
    where: { tenantId: TENANT_ID },
    select: { howDidYouLearn: true },
  });
  const sourceMap: Record<string, number> = {};
  visitors.forEach((v) => {
    const key = v.howDidYouLearn?.trim() || "Not specified";
    sourceMap[key] = (sourceMap[key] ?? 0) + 1;
  });
  return Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
}

export async function getFirstTimersByMonth(months = 6) {
  const now = new Date();
  const result: { label: string; count: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await db.visitor.count({
      where: { tenantId: TENANT_ID, submittedAt: { gte: start, lt: end } },
    });
    result.push({
      label: start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      count,
    });
  }
  return result;
}

export type DeptStats = Awaited<ReturnType<typeof getDepartmentStats>>;
export type FirstTimerPipeline = Awaited<ReturnType<typeof getFirstTimerPipeline>>;
