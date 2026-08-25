import { NextRequest, NextResponse } from "next/server";
import { aiFailed, aiUnavailable, flashModel, isAiConfigured, parseJSON } from "@/lib/ai/gemini";

export interface SermonSummaryResponse {
  summary: string;
  tags: string[];
  category: string;
  keyTakeaways: string[];
}

const FALLBACK: SermonSummaryResponse = {
  summary: "",
  tags: [],
  category: "General",
  keyTakeaways: [],
};

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      description,
      scriptureRef,
      series,
      speaker,
    }: {
      title: string;
      description?: string;
      scriptureRef?: string;
      series?: string;
      speaker?: string;
    } = await req.json();

    if (!isAiConfigured()) return aiUnavailable();
    if (!title) {
      return NextResponse.json(FALLBACK);
    }

    const prompt = `
You are the content assistant for Everlasting Hills Church (EHC), a charismatic evangelical church in Ibadan, Nigeria.
Generate metadata for the following sermon:

Title: ${title}
Speaker: ${speaker ?? "Unknown"}
Scripture: ${scriptureRef ?? "Not specified"}
Series: ${series ?? "Standalone"}
Description: ${description ?? "Not provided"}

Return a JSON object with exactly these keys:
- "summary": A 2-3 sentence summary of the sermon's likely theme and message, written in warm, engaging language for church members browsing the sermon library.
- "tags": An array of 4-6 short topic tags (e.g. ["faith", "prayer", "identity", "purpose"]). Lowercase, no hashtags.
- "category": One of: "Prayer", "Faith", "Identity", "Salvation", "Discipleship", "Family", "Finance", "Leadership", "Prophecy", "Worship", "Evangelism", "General"
- "keyTakeaways": An array of exactly 3 short, punchy takeaway sentences (each under 15 words). These display as bullet points in the sermon player.

Respond with only valid JSON, no markdown, no explanation.
`.trim();

    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSON<SermonSummaryResponse>(text);

    return NextResponse.json(data);
  } catch (err) {
    return aiFailed("/sermon-summary", err);
  }
}
