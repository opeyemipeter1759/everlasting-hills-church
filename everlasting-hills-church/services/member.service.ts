import { db } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/email/resend";
import { Role, MemberStatus } from "@prisma/client";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Onboarding ────────────────────────────────────────────────────────────────

export async function convertVisitorToMember(visitorId: string) {
  const visitor = await db.visitor.findUnique({ where: { id: visitorId } });
  if (!visitor) throw new Error("Visitor not found");
  if (!visitor.email)
    throw new Error("Visitor has no email — email is required to create an account");
  if (!visitor.phone)
    throw new Error("Visitor has no phone number — phone is used as the initial password");

  const existing = await db.member.findFirst({
    where: { tenantId: TENANT_ID, email: visitor.email },
  });
  if (existing) throw new Error("A member account already exists for this email address");

  const supabase = createAdminClient();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: visitor.email,
    password: visitor.phone,
    email_confirm: true,
    user_metadata: { needs_password_change: true },
  });
  if (authError) throw new Error(`Could not create auth account: ${authError.message}`);

  const userId = authData.user.id;

  const profile = await db.profile.create({
    data: { userId, tenantId: TENANT_ID, role: Role.MEMBER },
  });

  await db.roleAssignment.create({
    data: { tenantId: TENANT_ID, profileId: profile.id, role: Role.MEMBER },
  });

  const member = await db.member.create({
    data: {
      tenantId: TENANT_ID,
      profileId: profile.id,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email,
      phone: visitor.phone,
      dateOfBirth: visitor.dateOfBirth ? new Date(visitor.dateOfBirth) : null,
      address: visitor.address ?? null,
    },
  });

  // Welcome email — fire-and-forget
  const resend = getResendClient();
  resend.emails
    .send({
      from: `Everlasting Hills Church <${FROM}>`,
      to: visitor.email,
      subject: "Welcome to Everlasting Hills Church — Your Account is Ready",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <div style="background:#87102C;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;letter-spacing:-0.5px">Everlasting Hills Church</h1>
            <p style="color:#FFE8ED;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px">Member Portal</p>
          </div>
          <h2 style="color:#111;font-size:22px;margin:0 0 8px">Welcome, ${visitor.firstName}! 🎉</h2>
          <p style="color:#555;margin:0 0 24px;line-height:1.6">Your member account at Everlasting Hills Church is ready. Here are your login details:</p>
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:700">Login Details</p>
            <p style="margin:0 0 6px;color:#111"><strong>Website:</strong> <a href="${APP_URL}/login" style="color:#87102C">${APP_URL}/login</a></p>
            <p style="margin:0 0 6px;color:#111"><strong>Email:</strong> ${visitor.email}</p>
            <p style="margin:0;color:#111"><strong>Temporary Password:</strong> Your phone number (${visitor.phone})</p>
          </div>
          <p style="color:#555;margin:0 0 24px;font-size:14px;line-height:1.6">You will be asked to set a new password on your first login. We recommend doing this immediately.</p>
          <a href="${APP_URL}/login" style="display:inline-block;background:#87102C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Login to your account →</a>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0"/>
          <p style="color:#aaa;font-size:12px;margin:0">Everlasting Hills Church · Ibadan, Nigeria<br/>Raising men who flourish beyond limits.</p>
        </div>
      `,
    })
    .catch((err) => console.error("[member.service] welcome email failed:", err));

  return member;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getMemberWithProfile(userId: string) {
  return db.profile.findUnique({
    where: { userId },
    include: { member: true },
  });
}

export async function updateMemberProfile(
  userId: string,
  data: { phone?: string; address?: string; dateOfBirth?: string; bio?: string; photoUrl?: string }
) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  return db.member.update({
    where: { profileId: profile.id },
    data: {
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.dateOfBirth !== undefined && {
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
    },
  });
}

// ── Directory ─────────────────────────────────────────────────────────────────

export async function getAllMembers(opts?: { search?: string; status?: MemberStatus }) {
  return db.member.findMany({
    where: {
      tenantId: TENANT_ID,
      ...(opts?.status && { status: opts.status }),
      ...(opts?.search && {
        OR: [
          { firstName: { contains: opts.search, mode: "insensitive" } },
          { lastName:  { contains: opts.search, mode: "insensitive" } },
          { email:     { contains: opts.search, mode: "insensitive" } },
          { phone:     { contains: opts.search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ joinedAt: "desc" }],
    include: {
      _count: { select: { attendance: true } },
    },
  });
}

export async function getMemberById(memberId: string) {
  return db.member.findUnique({
    where: { id: memberId },
    include: {
      attendance: {
        include: { service: true },
        orderBy: { service: { scheduledAt: "desc" } },
        take: 20,
      },
      pastorNotes: { orderBy: { createdAt: "desc" } },
      followUpTasks: { orderBy: { createdAt: "desc" } },
      unitMemberships: { include: { unit: true } },
    },
  });
}

export async function updateMemberStatus(memberId: string, status: MemberStatus) {
  return db.member.update({ where: { id: memberId }, data: { status } });
}

// ── Birthdays ─────────────────────────────────────────────────────────────────

export async function getUpcomingBirthdays(daysAhead = 7) {
  const members = await db.member.findMany({
    where: { tenantId: TENANT_ID, dateOfBirth: { not: null } },
    select: { id: true, firstName: true, lastName: true, email: true, dateOfBirth: true, photoUrl: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return members
    .filter((m) => {
      if (!m.dateOfBirth) return false;
      const dob = new Date(m.dateOfBirth);
      // Normalise to this year
      const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
      return diff >= 0 && diff <= daysAhead;
    })
    .map((m) => {
      const dob = new Date(m.dateOfBirth!);
      const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
      return { ...m, dateOfBirth: m.dateOfBirth!.toISOString(), daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export async function getTodayBirthdays() {
  return getUpcomingBirthdays(0);
}

// ── Absence detection ─────────────────────────────────────────────────────────

export async function getAbsentMembers(missedSundays = 3) {
  // Get last N Sunday services
  const sundays = await db.service.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { scheduledAt: "desc" },
    take: missedSundays,
  });
  if (sundays.length < missedSundays) return [];

  const sundayIds = sundays.map((s) => s.id);
  const oldestSunday = sundays[sundays.length - 1].scheduledAt;

  // Members who haven't attended any of those services
  const allActive = await db.member.findMany({
    where: { tenantId: TENANT_ID, status: MemberStatus.ACTIVE, joinedAt: { lte: oldestSunday } },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
    include: {
      attendance: {
        where: { serviceId: { in: sundayIds } },
        select: { serviceId: true },
      },
    } as object,
  });

  return (allActive as Array<{ id: string; firstName: string; lastName: string; email: string | null; phone: string | null; photoUrl: string | null; attendance: { serviceId: string }[] }>)
    .filter((m) => m.attendance.length === 0)
    .map(({ attendance: _, ...m }) => m);
}

// ── Pastor notes ──────────────────────────────────────────────────────────────

export async function addPastorNote(memberId: string, content: string) {
  return db.pastorNote.create({
    data: { tenantId: TENANT_ID, memberId, content },
  });
}

export async function deletePastorNote(noteId: string) {
  return db.pastorNote.delete({ where: { id: noteId } });
}

// ── Follow-up tasks ───────────────────────────────────────────────────────────

export async function addFollowUpTask(memberId: string, title: string, dueDate?: string) {
  return db.followUpTask.create({
    data: {
      tenantId: TENANT_ID,
      memberId,
      title,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
}

export async function toggleFollowUpTask(taskId: string, done: boolean) {
  return db.followUpTask.update({
    where: { id: taskId },
    data: { done, completedAt: done ? new Date() : null },
  });
}

export async function deleteFollowUpTask(taskId: string) {
  return db.followUpTask.delete({ where: { id: taskId } });
}
