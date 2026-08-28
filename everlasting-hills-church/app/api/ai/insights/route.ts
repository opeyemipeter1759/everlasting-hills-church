import { NextRequest, NextResponse } from "next/server";
import { aiFailed, aiUnavailable, flashModel, isAiConfigured, parseJSON } from "@/lib/ai/gemini";
import type { AttendancePoint } from "@/lib/mock/admin-dashboard.mock";

export interface InsightsResponse {
  summary: string;
  attendanceChange: number;
  visitorRetentionChange: number;
  membersNeedingFollowUp: number;
}

const FALLBACK: InsightsResponse = {
  summary: "Analytics are being computed. Check back shortly.",
  attendanceChange: 0,
  visitorRetentionChange: 0,
  membersNeedingFollowUp: 0,
};

export async function POST(req: NextRequest) {
  try {
    const { trend }: { trend: AttendancePoint[] } = await req.json();

    if (!isAiConfigured()) return aiUnavailable();
    if (!trend?.length) {
      return NextResponse.json(FALLBACK);
    }

    const rows = trend
      .map(
        (p) =>
          `${p.label}: total=${p.value}${p.men !== undefined ? `, men=${p.men}, women=${p.women}, children=${p.children}, firstTimers=${p.firstTimers}` : ""} (${p.serviceType ?? "SERVICE"})`,
      )
      .join("\n");

    const prompt = `
You are the analytics assistant for Everlasting Hills Church (EHC), a church in Ibadan, Nigeria.
Analyse the following attendance headcount data for the last services:

${rows}

Return a JSON object with exactly these keys:
- "summary": A 2–3 sentence executive insight in warm but professional pastoral tone. Mention specific trends, comparisons, or patterns you notice. Use concrete numbers.
- "attendanceChange": Integer percentage change in total attendance from first to last data point (positive = growth, negative = decline).
- "visitorRetentionChange": Integer percentage change in first-timers from first to last data point.
- "membersNeedingFollowUp": Estimate of members who may need pastoral follow-up based on the trend (e.g. if attendance dropped, some members are absent).

Respond with only valid JSON, no markdown, no explanation.
`.trim();

    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSON<InsightsResponse>(text);

    return NextResponse.json(data);
  } catch (err) {
    return aiFailed("/insights", err);
  }
}
