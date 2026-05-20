import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const CONTACT_TO = process.env.CONTACT_EMAIL ?? "hello@everlastinghills.org";

export async function sendContactEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: `Everlasting Hills Contact <${FROM}>`,
    to: CONTACT_TO,
    replyTo: email,
    subject: `New message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  });
}
