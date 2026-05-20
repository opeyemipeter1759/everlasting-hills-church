import { db } from "@/lib/db/prisma";
import { getResendClient } from "@/lib/email/resend";
import type { ContactFormData } from "@/lib/validations/contact.schema";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const ADMIN_EMAIL =
  process.env.RESEND_ADMIN_EMAIL ??
  process.env.CONTACT_EMAIL ??
  "hello@everlastinghills.org";

export async function submitContactMessage(data: ContactFormData) {
  const resend = getResendClient();

  const record = await db.contactMessage.create({
    data: { tenantId: TENANT_ID, ...data },
  });

  await Promise.allSettled([
    resend.emails.send({
      from: `Everlasting Hills Contact <${FROM}>`,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `New message from ${data.name}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`,
    }),
    resend.emails.send({
      from: `Everlasting Hills <${FROM}>`,
      to: data.email,
      subject: "We received your message",
      text: [
        `Dear ${data.name},`,
        "",
        "Thank you for reaching out to Everlasting Hills Church.",
        "We've received your message and will get back to you as soon as possible.",
        "",
        "God bless you,",
        "Everlasting Hills Church",
      ].join("\n"),
    }),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[contact.service] email[${i}] failed:`, r.reason);
      }
    });
  });

  return record;
}
