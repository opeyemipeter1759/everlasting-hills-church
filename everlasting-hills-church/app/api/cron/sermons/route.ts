import { NextRequest, NextResponse } from "next/server";
import { publishScheduledSermons, getSubscribers, getLatestSermons } from "@/services/sermon.service";
import { getResendClient } from "@/lib/email/resend";

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await publishScheduledSermons();

  if (count === 0) return NextResponse.json({ published: 0, emailsSent: 0 });

  const [subscribers, latest] = await Promise.all([getSubscribers(), getLatestSermons(1)]);
  const sermon = latest[0];
  if (!sermon || subscribers.length === 0) return NextResponse.json({ published: count, emailsSent: 0 });

  const resend = getResendClient();
  const results = await Promise.allSettled(
    subscribers.map((s) =>
      resend.emails.send({
        from: `Everlasting Hills Church <${FROM}>`,
        to: s.email,
        subject: `New Sermon: ${sermon.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <div style="background:#87102C;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900">Everlasting Hills Church</h1>
            </div>
            <h2 style="color:#111;font-size:20px;margin:0 0 8px">${sermon.title}</h2>
            <p style="color:#666;font-size:14px;margin:0 0 4px">Speaker: ${sermon.speaker}</p>
            ${sermon.scriptureRef ? `<p style="color:#87102C;font-size:13px;font-weight:700;margin:0 0 16px">${sermon.scriptureRef}</p>` : ""}
            ${sermon.description ? `<p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px">${sermon.description}</p>` : ""}
            <a href="${APP_URL}/sermons/${sermon.slug}" style="display:inline-block;background:#87102C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">Listen Now →</a>
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0"/>
            <p style="color:#aaa;font-size:12px;margin:0">Everlasting Hills Church · Ibadan, Nigeria</p>
          </div>
        `,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ published: count, emailsSent: sent });
}
