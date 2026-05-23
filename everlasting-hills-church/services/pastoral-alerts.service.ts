import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function getPastoralAlerts(resolved = false) {
  const alerts = await db.pastoralAlert.findMany({
    where: {
      tenantId: TENANT_ID,
      resolvedAt: resolved ? { not: null } : null,
    },
    orderBy: { createdAt: "desc" },
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
  return alerts.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    isRead: a.isRead,
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    member: {
      id: a.member.id,
      name: `${a.member.firstName} ${a.member.lastName}`,
      email: a.member.email,
      phone: a.member.phone,
      photoUrl: a.member.photoUrl,
    },
  }));
}

export async function getAlertCounts() {
  const [total, unread, byType] = await Promise.all([
    db.pastoralAlert.count({ where: { tenantId: TENANT_ID, resolvedAt: null } }),
    db.pastoralAlert.count({ where: { tenantId: TENANT_ID, resolvedAt: null, isRead: false } }),
    db.pastoralAlert.groupBy({
      by: ["type"],
      where: { tenantId: TENANT_ID, resolvedAt: null },
      _count: { _all: true },
    }),
  ]);
  return {
    total,
    unread,
    byType: Object.fromEntries(byType.map((b) => [b.type, b._count._all])),
  };
}

export async function resolvePastoralAlert(alertId: string) {
  return db.pastoralAlert.update({
    where: { id: alertId },
    data: { resolvedAt: new Date(), isRead: true },
  });
}

export async function markAlertRead(alertId: string) {
  return db.pastoralAlert.update({
    where: { id: alertId },
    data: { isRead: true },
  });
}

export async function generateBirthdayAlerts() {
  const today = new Date();
  const members = await db.member.findMany({
    where: { tenantId: TENANT_ID, status: "ACTIVE", dateOfBirth: { not: null } },
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
  });

  const birthdayMembers = members.filter((m) => {
    if (!m.dateOfBirth) return false;
    const bday = new Date(m.dateOfBirth);
    const upcoming = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (upcoming < today) upcoming.setFullYear(today.getFullYear() + 1);
    const days = Math.round((upcoming.getTime() - today.getTime()) / 86400000);
    return days <= 7;
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  for (const m of birthdayMembers) {
    const existing = await db.pastoralAlert.findFirst({
      where: {
        tenantId: TENANT_ID,
        memberId: m.id,
        type: "BIRTHDAY",
        resolvedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    });
    if (!existing) {
      await db.pastoralAlert.create({
        data: {
          tenantId: TENANT_ID,
          memberId: m.id,
          type: "BIRTHDAY",
          message: `${m.firstName} ${m.lastName}'s birthday is coming up in the next 7 days.`,
        },
      });
    }
  }
}

export async function generateAbsenceAlerts(missedCount = 3) {
  const lastServices = await db.service.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { scheduledAt: "desc" },
    take: missedCount,
    select: { id: true },
  });

  if (lastServices.length < missedCount) return;

  const serviceIds = lastServices.map((s) => s.id);

  const [activeMembers, attendedInLastN] = await Promise.all([
    db.member.findMany({
      where: { tenantId: TENANT_ID, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
    }),
    db.attendanceRecord.findMany({
      where: { tenantId: TENANT_ID, serviceId: { in: serviceIds }, present: true },
      select: { memberId: true },
      distinct: ["memberId"],
    }),
  ]);

  const attendedSet = new Set(attendedInLastN.map((r) => r.memberId));
  const absent = activeMembers.filter((m) => !attendedSet.has(m.id));

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  for (const m of absent) {
    const existing = await db.pastoralAlert.findFirst({
      where: {
        tenantId: TENANT_ID,
        memberId: m.id,
        type: "ABSENCE",
        resolvedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    });
    if (!existing) {
      await db.pastoralAlert.create({
        data: {
          tenantId: TENANT_ID,
          memberId: m.id,
          type: "ABSENCE",
          message: `${m.firstName} ${m.lastName} has missed the last ${missedCount} services.`,
        },
      });
    }
  }
}

export async function generateInactiveAlerts() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

  const [activeMembers, recentAttendees] = await Promise.all([
    db.member.findMany({
      where: { tenantId: TENANT_ID, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
    }),
    db.attendanceRecord.findMany({
      where: {
        tenantId: TENANT_ID,
        present: true,
        service: { scheduledAt: { gte: ninetyDaysAgo } },
      },
      select: { memberId: true },
      distinct: ["memberId"],
    }),
  ]);

  const recentSet = new Set(recentAttendees.map((r) => r.memberId));
  const inactive = activeMembers.filter((m) => !recentSet.has(m.id));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  for (const m of inactive) {
    const existing = await db.pastoralAlert.findFirst({
      where: {
        tenantId: TENANT_ID,
        memberId: m.id,
        type: "INACTIVE",
        resolvedAt: null,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    if (!existing) {
      await db.pastoralAlert.create({
        data: {
          tenantId: TENANT_ID,
          memberId: m.id,
          type: "INACTIVE",
          message: `${m.firstName} ${m.lastName} has not attended any service in 90 days.`,
        },
      });
    }
  }
}

export type PastoralAlertItem = Awaited<ReturnType<typeof getPastoralAlerts>>[number];
