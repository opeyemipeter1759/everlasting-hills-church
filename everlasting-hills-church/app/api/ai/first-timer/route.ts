import { NextRequest, NextResponse } from "next/server";
import { flashModel, parseJSON } from "@/lib/ai/gemini";

export interface FirstTimerAnalysis {
  sentiment: "positive" | "neutral" | "seeking" | "distressed";
  primaryNeed: string;
  insight: string; // 1-sentence for admin panel
  contactScript: string; // Opening 2-3 sentences for the follow-up call/WhatsApp
  conversionScore: number; // 1-10
  conversionReason: string; // 1-sentence reason for the score
}

const FALLBACK: FirstTimerAnalysis = {
  sentiment: "neutral",
  primaryNeed: "Community connection",
  insight: "Analysis unavailable — review the form submission manually.",
  contactScript: "Hi [Name], this is [YourName] from Everlasting Hills Church. We're so glad you joined us and wanted to personally reach out to say welcome.",
  conversionScore: 5,
  conversionReason: "Insufficient data to score accurately.",
};

export async function POST(req: NextRequest) {
  try {
    const {
      firstName,
      membershipInterest,
      howDidYouLearn,
      bornAgain,
      locatedInIbadan,
      serviceExperience,
      prayerPoint,
      attendanceType,
    }: {
      firstName: string;
      membershipInterest?: string | null;
      howDidYouLearn?: string | null;
      bornAgain?: string | null;
      locatedInIbadan?: boolean | null;
      serviceExperience?: string | null;
      prayerPoint?: string | null;
      attendanceType?: string | null;
    } = await req.json();

    if (!process.env.GEMINI_API_KEY || !firstName) {
      return NextResponse.json(FALLBACK);
    }

    const prompt = `
You are the first-timer follow-up assistant for Everlasting Hills Church (EHC), a charismatic evangelical church in Ibadan, Nigeria.
Analyse this first-timer registration and generate follow-up intelligence.

First name: ${firstName}
Attendance type: ${attendanceType ?? "Unknown"}
Membership interest: ${membershipInterest ?? "Not stated"}
Born again: ${bornAgain ?? "Not stated"}
Located in Ibadan: ${locatedInIbadan === true ? "Yes" : locatedInIbadan === false ? "No (visiting/outside)" : "Unknown"}
How they found us: ${howDidYouLearn ?? "Not stated"}
Service experience (their words): "${serviceExperience ?? "Not provided"}"
Prayer point shared: "${prayerPoint ?? "None shared"}"

Return a JSON object with exactly these keys:
- "sentiment": One of "positive" (enthusiastic, clearly enjoyed), "neutral" (standard response), "seeking" (looking for spiritual answers, life change), "distressed" (mentioned hardship, pain, or crisis)
- "primaryNeed": A short phrase (3-8 words) describing their most likely need (e.g. "Spiritual community", "Salvation and new birth", "Life direction", "Healing and restoration")
- "insight": One sentence for the follow-up team that synthesises the above into a pastoral observation.
- "contactScript": A warm, natural 2-3 sentence opening for a WhatsApp message or phone call from a volunteer. Reference how they found us and their experience if available. Do NOT use [placeholder] names — use "${firstName}" for their name and leave "from EHC" for the volunteer's intro. Sound human, not templated.
- "conversionScore": An integer 1-10 estimating likelihood of becoming a member (10 = very likely). Weight: membership_interest Yes=+4, Maybe=+2, No=-2; bornAgain=Yes+2; locatedInIbadan=Yes+2; positive experience text+1; prayerPoint provided+1.
- "conversionReason": One sentence explaining the score.

Respond with only valid JSON, no markdown, no explanation.
`.trim();

    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSON<FirstTimerAnalysis>(text);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[AI /first-timer]", err);
    return NextResponse.json(FALLBACK);
  }
}
