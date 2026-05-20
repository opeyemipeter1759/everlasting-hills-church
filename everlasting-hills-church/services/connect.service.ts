import { db } from "@/lib/db/prisma";
import { getResendClient } from "@/lib/email/resend";
import type { Prisma } from "@prisma/client";
import type {
  FirstTimerData,
  PrayerRequestData,
  TestimonyData,
} from "@/lib/validations/connect.schema";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const ADMIN_EMAIL =
  process.env.RESEND_ADMIN_EMAIL ??
  process.env.CONTACT_EMAIL ??
  "hello@everlastinghills.org";

export async function submitFirstTimer(data: FirstTimerData) {
  const [visitor] = await Promise.all([
    db.visitor.create({
      data: {
        tenantId: TENANT_ID,
        firstName: data.first_name.trim(),
        lastName: data.last_name.trim(),
        phone: data.phone_number.trim(),
        email: data.email ? data.email.trim() : null,
        gender: data.gender ?? null,
        attendanceType: data.attendance_type ?? null,
        howDidYouLearn: data.how_did_you_learn ?? null,
        invitedBy: data.invited_by ?? null,
        locatedInIbadan: data.located_in_ibadan ?? null,
        membershipInterest: data.membership_interest ?? null,
        address: data.address ?? null,
        occupation: data.occupation ?? null,
        bornAgain: data.born_again ?? null,
        serviceExperience: data.service_experience ?? null,
        prayerPoint: data.prayer_point ?? null,
        whatsappInterest: data.whatsapp_interest ?? null,
      },
    }),
    db.formSubmission.create({
      data: {
        tenantId: TENANT_ID,
        type: "first_timer",
        data: data as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  const resend = getResendClient();
  const emailJobs: Promise<unknown>[] = [
    resend.emails.send({
      from: `Everlasting Hills <${FROM}>`,
      to: ADMIN_EMAIL,
      subject: `New First Timer: ${data.first_name} ${data.last_name}`,
      text: buildAdminText(data),
    }),
  ];

  if (data.email) {
    emailJobs.push(
      resend.emails.send({
        from: `Everlasting Hills <${FROM}>`,
        to: data.email,
        subject: "Welcome to Everlasting Hills Church!",
        text: [
          `Dear ${data.first_name},`,
          "",
          "Thank you for visiting Everlasting Hills Church! We're so glad you came.",
          "Our team will be in touch with you shortly.",
          "",
          "God bless you,",
          "Everlasting Hills Church",
        ].join("\n"),
      })
    );
  }

  await Promise.allSettled(emailJobs).then((results) => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[connect.service] first-timer email[${i}] failed:`, r.reason);
      }
    });
  });

  return visitor;
}

export async function submitPrayerRequest(data: PrayerRequestData) {
  const record = await db.prayerRequest.create({
    data: {
      tenantId: TENANT_ID,
      request: data.request.trim(),
      name: data.name ? data.name.trim() : null,
      email: data.email ? data.email.trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      isAnonymous: data.is_anonymous ?? false,
    },
  });

  const displayName =
    data.is_anonymous ? "Anonymous" : (data.name?.trim() || "Anonymous");

  const resend = getResendClient();
  await resend.emails
    .send({
      from: `Everlasting Hills <${FROM}>`,
      to: ADMIN_EMAIL,
      subject: `New Prayer Request from ${displayName}`,
      text: [
        `Name: ${displayName}`,
        `Email: ${data.email ?? "—"}`,
        `Phone: ${data.phone ?? "—"}`,
        "",
        "Request:",
        data.request,
      ].join("\n"),
    })
    .catch((err) =>
      console.error("[connect.service] prayer-request email failed:", err)
    );

  return record;
}

export async function submitTestimony(data: TestimonyData) {
  return db.formSubmission.create({
    data: {
      tenantId: TENANT_ID,
      type: "testimony",
      data: data as unknown as Prisma.InputJsonValue,
    },
  });
}

function buildAdminText(d: FirstTimerData) {
  return [
    `Name: ${d.first_name} ${d.last_name}`,
    `Phone: ${d.phone_number}`,
    d.email ? `Email: ${d.email}` : null,
    d.gender ? `Gender: ${d.gender}` : null,
    d.occupation ? `Occupation: ${d.occupation}` : null,
    d.address ? `Address: ${d.address}` : null,
    d.birth_month && d.birth_day ? `Date of birth: ${d.birth_day} ${d.birth_month}` : null,
    d.how_did_you_learn
      ? `How did they hear about us: ${d.how_did_you_learn}`
      : null,
    d.invited_by ? `Invited by: ${d.invited_by}` : null,
    d.membership_interest
      ? `Membership interest: ${d.membership_interest}`
      : null,
    d.born_again ? `Born again: ${d.born_again}` : null,
    d.service_experience
      ? `Service experience: ${d.service_experience}`
      : null,
    d.prayer_point ? `Prayer point: ${d.prayer_point}` : null,
    typeof d.located_in_ibadan === "boolean"
      ? `Located in Ibadan: ${d.located_in_ibadan ? "Yes" : "No"}`
      : null,
    typeof d.whatsapp_interest === "boolean"
      ? `WhatsApp interest: ${d.whatsapp_interest ? "Yes" : "No"}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
