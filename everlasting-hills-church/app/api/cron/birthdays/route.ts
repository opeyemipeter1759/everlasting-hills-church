import { NextRequest, NextResponse } from "next/server";
import { getTodayBirthdays } from "@/services/member.service";
import { getResendClient } from "@/lib/email/resend";
import { generateBirthdayAlerts } from "@/services/pastoral-alerts.service";

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Vercel cron auth
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await generateBirthdayAlerts();
  const birthdays = await getTodayBirthdays();
  if (birthdays.length === 0) {
    return NextResponse.json({ sent: 0, message: "No birthdays today" });
  }

  const resend = getResendClient();
  const results = await Promise.allSettled(
    birthdays
      .filter((b) => b.email)
      .map((b) =>
        resend.emails.send({
          from: `Everlasting Hills Church <${FROM}>`,
          to: b.email!,
          subject: `Happy Birthday, ${b.firstName}! 🎂 From EHC Family`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
              <div style="background:#87102C;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;letter-spacing:-0.5px">Everlasting Hills Church</h1>
                <p style="color:#FFE8ED;margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px">Member Portal</p>
              </div>
              <div style="text-align:center;padding:16px 0 24px">
                <div style="font-size:64px;line-height:1">🎂</div>
              </div>
              <h2 style="color:#111;font-size:24px;margin:0 0 8px;text-align:center">Happy Birthday, ${b.firstName}!</h2>
              <p style="color:#555;margin:0 0 24px;line-height:1.6;text-align:center;font-size:15px">
                The entire Everlasting Hills Church family celebrates you today.<br/>
                May God's blessings overflow in your life this new year of age.
              </p>
              <div style="background:#FFF4F6;border:1px solid #F9D0D8;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
                <p style="margin:0;color:#87102C;font-size:14px;font-weight:700;font-style:italic">
                  "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."
                </p>
                <p style="margin:8px 0 0;color:#b06070;font-size:12px">— Jeremiah 29:11</p>
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

  return NextResponse.json({ sent, failed, total: birthdays.length });
}
