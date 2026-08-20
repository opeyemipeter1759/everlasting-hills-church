import { NextRequest, NextResponse } from "next/server";
import { flashModel, parseJSON } from "@/lib/ai/gemini";

export type PrayerCategory =
  | "Health"
  | "Relationships"
  | "Finance"
  | "Grief"
  | "Salvation"
  | "Purpose"
  | "Family"
  | "Thanksgiving"
  | "Career"
  | "Spiritual Growth"
  | "Other";

export type PrayerUrgency = "routine" | "needs-attention" | "urgent";

export interface PrayerTriageResponse {
  category: PrayerCategory;
  urgency: PrayerUrgency;
  routeTo: string;
  summary: string; // 1-sentence safe summary (without PII) for team digest
}

const FALLBACK: PrayerTriageResponse = {
  category: "Other",
  urgency: "routine",
  routeTo: "General Intercessory Team",
  summary: "Prayer request received.",
};

export async function POST(req: NextRequest) {
  try {
    const {
      request,
      isAnonymous,
    }: { request: string; isAnonymous: boolean } = await req.json();

    if (!process.env.GEMINI_API_KEY || !request?.trim()) {
      return NextResponse.json(FALLBACK);
    }

    const prompt = `
You are the pastoral care assistant for Everlasting Hills Church (EHC), Ibadan, Nigeria.
Triage the following prayer request. The submission is ${isAnonymous ? "anonymous" : "named"}.

Prayer request text:
"${request}"

Return a JSON object with exactly these keys:
- "category": One of: "Health", "Relationships", "Finance", "Grief", "Salvation", "Purpose", "Family", "Thanksgiving", "Career", "Spiritual Growth", "Other"
- "urgency": One of:
  - "urgent" — the person mentions crisis, danger, suicidal thoughts, severe illness, bereavement, or immediate emergency
  - "needs-attention" — significant emotional distress, major life change, or needs response within 48 hours
  - "routine" — general prayer request with no immediate urgency
- "routeTo": The team name that should handle this (e.g. "Medical Prayer Team", "Marriage & Family Team", "Financial Counselling Team", "Bereavement Support", "General Intercessory Team")
- "summary": A one-sentence neutral summary of the request theme WITHOUT including names, specific people, or identifying details — safe to share in a team digest.

Respond with only valid JSON, no markdown, no explanation.
`.trim();

    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSON<PrayerTriageResponse>(text);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[AI /prayer-triage]", err);
    return NextResponse.json(FALLBACK);
  }
}
