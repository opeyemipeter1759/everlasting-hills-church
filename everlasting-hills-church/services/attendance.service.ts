import { db } from "@/lib/db/prisma";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

// Africa/Lagos is UTC+1 (WAT). Use this to compute "today" correctly.
function getTodayBounds() {
  const WAT_OFFSET_MS = 60 * 60 * 1000;
  const now = new Date();
  const localNow = new Date(now.getTime() + WAT_OFFSET_MS);
  // Midnight WAT expressed as UTC timestamp
  const midnightWAT = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate()
  );
  const startUtc = new Date(midnightWAT - WAT_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

export async function getTodayService() {
  const { startUtc, endUtc } = getTodayBounds();
  return db.service.findFirst({
    where: { tenantId: TENANT_ID, scheduledAt: { gte: startUtc, lt: endUtc } },
  });
}

export async function findOrCreateTodayService() {
  const existing = await getTodayService();
  if (existing) return existing;

  const { startUtc } = getTodayBounds();
  // Format date in Lagos timezone for the service name
  const label = new Date(startUtc.getTime() + 60 * 60 * 1000).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return db.service.create({
    data: {
      tenantId: TENANT_ID,
      name: `Sunday Service — ${label}`,
      scheduledAt: startUtc,
    },
  });
}

export async function checkIn(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  const member = await db.member.findUnique({ where: { profileId: profile.id } });
  if (!member) throw new Error("Member record not found");

  const service = await findOrCreateTodayService();

  const existing = await db.attendanceRecord.findUnique({
    where: { memberId_serviceId: { memberId: member.id, serviceId: service.id } },
  });
  if (existing) return { alreadyCheckedIn: true as const, service };

  await db.attendanceRecord.create({
    data: { tenantId: TENANT_ID, memberId: member.id, serviceId: service.id, present: true },
  });
  return { alreadyCheckedIn: false as const, service };
}

export async function getMemberAttendance(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) return [];

  const member = await db.member.findUnique({ where: { profileId: profile.id } });
  if (!member) return [];

  return db.attendanceRecord.findMany({
    where: { memberId: member.id, tenantId: TENANT_ID },
    include: { service: true },
    orderBy: { service: { scheduledAt: "desc" } },
  });
}

export async function getTodayAttendanceWithMembers() {
  const service = await getTodayService();
  if (!service) return null;

  const records = await db.attendanceRecord.findMany({
    where: { serviceId: service.id, tenantId: TENANT_ID, present: true },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
    },
    orderBy: { id: "asc" },
  });
  return { service, records };
}

export async function getAllServicesWithCounts() {
  return db.service.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { scheduledAt: "desc" },
    include: { _count: { select: { attendance: { where: { present: true } } } } },
    take: 50,
  });
}

export async function getNextService() {
  return db.service.findFirst({
    where: { tenantId: TENANT_ID, scheduledAt: { gt: new Date() } },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function countTotalServices() {
  return db.service.count({ where: { tenantId: TENANT_ID } });
}

export async function getRecentServicesStats(limit = 4) {
  return db.service.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { scheduledAt: "desc" },
    take: limit,
    include: { _count: { select: { attendance: { where: { present: true } } } } },
  });
}

export async function countTodayCheckIns() {
  const service = await getTodayService();
  if (!service) return 0;
  return db.attendanceRecord.count({
    where: { serviceId: service.id, tenantId: TENANT_ID, present: true },
  });
}
