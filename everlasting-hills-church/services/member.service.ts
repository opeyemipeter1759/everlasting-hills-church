import { db } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/email/resend";
import { Role } from "@prisma/client";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

  // Create Supabase auth user (phone number as initial password)
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
      text: [
        `Dear ${visitor.firstName},`,
        "",
        "Your member account has been created at Everlasting Hills Church.",
        "",
        "Login details:",
        `  Website: ${APP_URL}/login`,
        `  Email:    ${visitor.email}`,
        `  Password: Your phone number (${visitor.phone})`,
        "",
        "We recommend changing your password after your first login.",
        "",
        "God bless you,",
        "Everlasting Hills Church",
      ].join("\n"),
    })
    .catch((err) =>
      console.error("[member.service] welcome email failed:", err)
    );

  return member;
}

export async function getMemberWithProfile(userId: string) {
  return db.profile.findUnique({
    where: { userId },
    include: { member: true },
  });
}

export async function updateMemberProfile(
  userId: string,
  data: { phone?: string; address?: string; dateOfBirth?: string }
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
    },
  });
}
