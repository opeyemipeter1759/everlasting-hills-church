import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

async function generateMemberDirectory() {
  const members = await db.member.findMany({
    where: { tenantId: TENANT_ID, status: "ACTIVE" },
    orderBy: { lastName: "asc" },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      address: true,
      joinedAt: true,
      status: true,
    },
  });
  return members.map((m) => ({
    "First Name": m.firstName,
    "Last Name": m.lastName,
    Email: m.email ?? "",
    Phone: m.phone ?? "",
    "Date of Birth": m.dateOfBirth ? m.dateOfBirth.toISOString().slice(0, 10) : "",
    Address: m.address ?? "",
    "Joined At": m.joinedAt.toISOString().slice(0, 10),
    Status: m.status,
  }));
}

async function generateAttendanceExport() {
  const records = await db.attendanceRecord.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { service: { scheduledAt: "desc" } },
    include: {
      member: { select: { firstName: true, lastName: true, email: true } },
      service: { select: { name: true, scheduledAt: true } },
    },
  });
  return records.map((r) => ({
    "Member First Name": r.member.firstName,
    "Member Last Name": r.member.lastName,
    Email: r.member.email ?? "",
    Service: r.service.name,
    "Service Date": r.service.scheduledAt.toISOString().slice(0, 10),
    Present: r.present ? "Yes" : "No",
  }));
}

async function generateGivingReport() {
  const records = await db.givingRecord.findMany({
    where: { tenantId: TENANT_ID, paystackStatus: "success" },
    orderBy: { createdAt: "desc" },
    select: {
      reference: true,
      amount: true,
      currency: true,
      donorName: true,
      donorEmail: true,
      category: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
  return records.map((r) => ({
    Reference: r.reference,
    "Amount (₦)": (r.amount / 100).toFixed(2),
    Currency: r.currency,
    "Donor Name": r.donorName ?? "Anonymous",
    "Donor Email": r.donorEmail ?? "",
    Category: r.category ?? "General",
    "Verified At": r.verifiedAt ? r.verifiedAt.toISOString().slice(0, 10) : "",
    "Created At": r.createdAt.toISOString().slice(0, 10),
  }));
}

async function generateFirstTimerExport() {
  const visitors = await db.visitor.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { submittedAt: "desc" },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      gender: true,
      attendanceType: true,
      howDidYouLearn: true,
      membershipInterest: true,
      bornAgain: true,
      locatedInIbadan: true,
      occupation: true,
      submittedAt: true,
    },
  });
  return visitors.map((v) => ({
    "First Name": v.firstName,
    "Last Name": v.lastName,
    Email: v.email ?? "",
    Phone: v.phone ?? "",
    Gender: v.gender ?? "",
    "Attendance Type": v.attendanceType ?? "",
    "How Did You Hear": v.howDidYouLearn ?? "",
    "Membership Interest": v.membershipInterest ?? "",
    "Born Again": v.bornAgain ?? "",
    "Located in Ibadan": v.locatedInIbadan == null ? "" : v.locatedInIbadan ? "Yes" : "No",
    Occupation: v.occupation ?? "",
    "Submitted At": v.submittedAt.toISOString().slice(0, 10),
  }));
}

async function generateWeeklyPastorReport() {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const [newMembers, newVisitors, services, followUps] = await Promise.all([
    db.member.findMany({
      where: { tenantId: TENANT_ID, joinedAt: { gte: weekStart } },
      select: { firstName: true, lastName: true, email: true, phone: true, joinedAt: true },
    }),
    db.visitor.findMany({
      where: { tenantId: TENANT_ID, submittedAt: { gte: weekStart } },
      select: { firstName: true, lastName: true, email: true, phone: true, membershipInterest: true, submittedAt: true },
    }),
    db.service.findMany({
      where: { tenantId: TENANT_ID, scheduledAt: { gte: weekStart } },
      include: { _count: { select: { attendance: { where: { present: true } } } } },
      orderBy: { scheduledAt: "asc" },
    }),
    db.followUpTask.findMany({
      where: { tenantId: TENANT_ID, done: false },
      include: { member: { select: { firstName: true, lastName: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
  ]);

  const rows: Record<string, unknown>[] = [
    { Section: "WEEKLY PASTOR REPORT", Value: `Week of ${weekStart.toLocaleDateString()}` },
    { Section: "", Value: "" },
    { Section: "SERVICES THIS WEEK", Value: services.length },
    ...services.map((s) => ({
      Section: s.name,
      Value: `${s._count.attendance} attendees on ${s.scheduledAt.toLocaleDateString()}`,
    })),
    { Section: "", Value: "" },
    { Section: "NEW MEMBERS", Value: newMembers.length },
    ...newMembers.map((m) => ({
      Section: `${m.firstName} ${m.lastName}`,
      Value: m.email ?? m.phone ?? "",
    })),
    { Section: "", Value: "" },
    { Section: "FIRST TIMERS", Value: newVisitors.length },
    ...newVisitors.map((v) => ({
      Section: `${v.firstName} ${v.lastName}`,
      Value: `Interest: ${v.membershipInterest ?? "N/A"} | ${v.email ?? v.phone ?? ""}`,
    })),
    { Section: "", Value: "" },
    { Section: "OPEN FOLLOW-UPS", Value: followUps.length },
    ...followUps.map((f) => ({
      Section: f.title,
      Value: `${f.member.firstName} ${f.member.lastName} — Due: ${f.dueDate ? f.dueDate.toLocaleDateString() : "No date"}`,
    })),
  ];
  return rows;
}

async function generateMonthlyBoardReport() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalMembers, activeMembers, newThisMonth, newLastMonth, visitors, totalGiving, thisMonthGiving, services] =
    await Promise.all([
      db.member.count({ where: { tenantId: TENANT_ID } }),
      db.member.count({ where: { tenantId: TENANT_ID, status: "ACTIVE" } }),
      db.member.count({ where: { tenantId: TENANT_ID, joinedAt: { gte: monthStart } } }),
      db.member.count({ where: { tenantId: TENANT_ID, joinedAt: { gte: lastMonthStart, lt: monthStart } } }),
      db.visitor.count({ where: { tenantId: TENANT_ID, submittedAt: { gte: monthStart } } }),
      db.givingRecord.aggregate({ where: { tenantId: TENANT_ID, paystackStatus: "success" }, _sum: { amount: true } }),
      db.givingRecord.aggregate({ where: { tenantId: TENANT_ID, paystackStatus: "success", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      db.service.findMany({
        where: { tenantId: TENANT_ID, scheduledAt: { gte: monthStart } },
        include: { _count: { select: { attendance: { where: { present: true } } } } },
      }),
    ]);

  const avgAttendance = services.length > 0
    ? Math.round(services.reduce((s, sv) => s + sv._count.attendance, 0) / services.length)
    : 0;

  return [
    { Metric: "Report Period", Value: `${monthStart.toLocaleDateString()} — ${now.toLocaleDateString()}` },
    { Metric: "Total Members", Value: totalMembers },
    { Metric: "Active Members", Value: activeMembers },
    { Metric: "New Members This Month", Value: newThisMonth },
    { Metric: "New Members Last Month", Value: newLastMonth },
    { Metric: "First Timers This Month", Value: visitors },
    { Metric: "Services This Month", Value: services.length },
    { Metric: "Avg Attendance per Service", Value: avgAttendance },
    { Metric: "Total Giving (All Time) ₦", Value: ((totalGiving._sum.amount ?? 0) / 100).toFixed(2) },
    { Metric: "Giving This Month ₦", Value: ((thisMonthGiving._sum.amount ?? 0) / 100).toFixed(2) },
  ];
}

const GENERATORS: Record<string, () => Promise<Record<string, unknown>[]>> = {
  "member-directory": generateMemberDirectory,
  "attendance-export": generateAttendanceExport,
  "giving-report": generateGivingReport,
  "first-timer-export": generateFirstTimerExport,
  "weekly-pastor": generateWeeklyPastorReport,
  "monthly-board": generateMonthlyBoardReport,
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "PASTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "";
  const generator = GENERATORS[type];
  if (!generator) {
    return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 });
  }

  const rows = await generator();
  const csv = toCSV(rows);
  const filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
