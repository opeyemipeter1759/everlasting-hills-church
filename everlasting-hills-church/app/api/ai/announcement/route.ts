import { NextRequest, NextResponse } from "next/server";
import { flashModel, parseJSON } from "@/lib/ai/gemini";

export interface AnnouncementDraftResponse {
  title: string;
  body: string;
}

export async function POST(req: NextRequest) {
  try {
    const { idea }: { idea: string } = await req.json();

    if (!process.env.GEMINI_API_KEY || !idea?.trim()) {
      return NextResponse.json({ title: "", body: "" });
    }

    const prompt = `
You are the communications assistant for Everlasting Hills Church (EHC), a charismatic evangelical church in Ibadan, Nigeria.
Write a polished church announcement based on this rough idea from the admin:

"${idea}"

Guidelines:
- Warm, inviting, and faith-filled tone — EHC is a family, not a corporation
- Clear and concise — members read on their phones
- Include any key details mentioned (time, dress code, event name, etc.)
- End with a gentle call-to-action if relevant
- Do NOT add fictitious details not mentioned in the idea

Return a JSON object with exactly these keys:
- "title": A compelling announcement title (5-12 words max)
- "body": The full announcement body (2-4 short paragraphs, using \\n\\n between paragraphs). Plain text only — no markdown, no asterisks, no bullet points.

Respond with only valid JSON, no markdown fence, no explanation.
`.trim();

    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSON<AnnouncementDraftResponse>(text);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[AI /announcement]", err);
    return NextResponse.json({ title: "", body: "" });
  }
}
