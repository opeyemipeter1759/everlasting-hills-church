import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, whyRegister, submittedToPastor, homeAddress, capacity, phone } = body;

  if (!name || !email || !phone) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "no-reply@everlastinghills.church",
      to: email,
      subject: "Home Cell Registration Received — Everlasting Hills Church",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Home Cell Registration</title>
        </head>
        <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <tr>
                    <td style="background:#87102C;padding:36px 40px;text-align:center;">
                      <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.65);font-weight:600;">Everlasting Hills Church</p>
                      <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Home Cell Registration</h1>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;line-height:1.6;">Dear <strong>${name}</strong>,</p>

                      <p style="margin:0 0 18px;font-size:15px;color:#333;line-height:1.75;">
                        Thank you for taking this meaningful step of faith. We have received your Home Cell registration, and we are truly grateful for your heart to open your home and gather people around the Word of God.
                      </p>

                      <p style="margin:0 0 18px;font-size:15px;color:#333;line-height:1.75;">
                        Home Cells are at the heart of how we do community at Everlasting Hills Church, and your willingness to lead one is a testimony of your commitment to the vision of this house. We are excited about what God is going to do through your cell.
                      </p>

                      <p style="margin:0 0 32px;font-size:15px;color:#333;line-height:1.75;">
                        One of our pastoral team members will be reaching out to you personally in the coming days to have a conversation, provide guidance, and walk you through the next steps. In the meantime, please continue to hold this vision before the Lord and trust that He who began this good work in you will see it through to completion.
                      </p>

                      <!-- Divider -->
                      <div style="border-top:1px solid #f0e8ea;margin-bottom:32px;"></div>

                      <!-- Scripture -->
                      <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="border-left:3px solid #87102C;padding:0 0 0 20px;">
                            <p style="margin:0 0 6px;font-size:14px;color:#555;font-style:italic;line-height:1.65;">
                              "And let us consider one another in order to stir up love and good works, not forsaking the assembling of ourselves together…"
                            </p>
                            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#87102C;">Hebrews 10:24–25</p>
                          </td>
                        </tr>
                      </table>

                      <div style="border-top:1px solid #f0e8ea;margin:32px 0;"></div>

                      <p style="margin:0;font-size:15px;color:#333;line-height:1.75;">
                        With love and anticipation,
                      </p>
                      <p style="margin:8px 0 0;font-size:15px;font-weight:700;color:#87102C;">The Pastoral Team</p>
                      <p style="margin:2px 0 0;font-size:13px;color:#888;">Everlasting Hills Church</p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#faf5f6;padding:20px 40px;text-align:center;border-top:1px solid #f0e8ea;">
                      <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
                        This message was sent because you submitted a Home Cell registration on our website.<br/>
                        © ${new Date().getFullYear()} Everlasting Hills Church. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Home cell registration email error:", error);
    return NextResponse.json({ error: "Failed to send confirmation email." }, { status: 500 });
  }
}
