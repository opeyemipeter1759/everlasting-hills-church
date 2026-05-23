import { NextRequest, NextResponse } from "next/server";
import { getAbsentMembers } from "@/services/member.service";
import { getResendClient } from "@/lib/email/resend";
import { generateAbsenceAlerts, generateInactiveAlerts } from "@/services/pastoral-alerts.service";

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await Promise.all([generateAbsenceAlerts(3), generateInactiveAlerts()]);
  const absentMembers = await getAbsentMembers(3);
  const withEmail = absentMembers.filter((m) => m.email);

  if (withEmail.length === 0) {
    return NextResponse.json({ sent: 0, message: "No absent members with email" });
  }

  const resend = getResendClient();
  const results = await Promise.allSettled(
    withEmail.map((m) =>
      resend.emails.send({
        from: `Everlasting Hills Church <${FROM}>`,
        to: m.email!,
        subject: `We miss you, ${m.firstName}! 💛`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <div style="background:#87102C;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;letter-spacing:-0.5px">Everlasting Hills Church</h1>
              <p style="color:#FFE8ED;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px">Member Portal</p>
            </div>
            <div style="text-align:center;padding:16px 0 24px">
              <div style="font-size:64px;line-height:1">💛</div>
            </div>
            <h2 style="color:#111;font-size:22px;margin:0 0 8px;text-align:center">We miss you, ${m.firstName}!</h2>
            <p style="color:#555;margin:0 0 24px;line-height:1.6;text-align:center;font-size:15px">
              We noticed you haven't been with us at Everlasting Hills Church for the last few Sundays.<br/>
              Your presence matters to us — we'd love to see you back!
            </p>
            <div style="background:#FFF9F0;border:1px solid #FDE8C0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
              <p style="margin:0;color:#92600A;font-size:14px;font-weight:700;font-style:italic">
                "Not giving up meeting together, as some are in the habit of doing, but encouraging one another."
              </p>
              <p style="margin:8px 0 0;color:#b07830;font-size:12px">— Hebrews 10:25</p>
            </div>
            <p style="color:#555;font-size:14px;line-height:1.6;text-align:center;margin-bottom:24px">
              We pray all is well with you. If you need anything, our doors — and our hearts — are always open.
            </p>
            <div style="text-align:center;margin-bottom:24px">
              <a href="${APP_URL}/me" style="display:inline-block;background:#87102C;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
                Visit Member Portal →
              </a>
            </div>
            <p style="color:#555;font-size:14px;line-height:1.6;text-align:center">
              With love and prayers,<br/>
              <strong>The EHC Family</strong>
            </p>
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0"/>
            <p style="color:#aaa;font-size:12px;margin:0;text-align:center">Everlasting Hills Church · Ibadan, Nigeria<br/>Raising men who flourish beyond limits.</p>
          </div>
        `,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: withEmail.length });
}
