import { NextRequest, NextResponse } from "next/server";
import { flashModel, parseJSON } from "@/lib/ai/gemini";

export interface TestimonyPolishResponse {
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { content }: { content: string } = await req.json();

    if (!process.env.GEMINI_API_KEY || !content?.trim()) {
      return NextResponse.json({ content: content ?? "" });
    }

    const prompt = `
You are helping polish a member's personal testimony for Everlasting Hills Church (EHC), a charismatic evangelical church in Ibadan, Nigeria, before it's published on the church website.

Here is the testimony as submitted:

"${content.trim()}"

Rewrite it to sound genuinely more polished and engaging — this should read like a noticeably better version, not a light copyedit. Restructure sentences, vary rhythm, tighten weak phrasing, and choose warmer, more vivid wording throughout.

Guidelines:
- Do NOT invent new facts, events, names, dates, or details that weren't in the original — every claim must still be something the person actually said
- You MAY reorder sentences, combine or split them, cut filler/repetition, and rephrase freely in their voice to improve flow and impact
- Keep it first-person, warm, and sincere — this is someone's real story, not marketing copy
- Length can shift moderately (tighter or a touch fuller) if it serves clarity — don't pad with fluff, and don't compress it into a stub
- Preserve paragraph breaks (use \\n\\n between paragraphs) if the original had more than one paragraph
- Plain text only — no markdown, no asterisks, no bullet points, no quotation marks wrapping the whole thing

Return a JSON object with exactly this key:
- "content": the polished testimony text

Respond with only valid JSON, no markdown fence, no explanation.
`.trim();

    const result = await flashModel.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSON<TestimonyPolishResponse>(text);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[AI /testimony]", err);
    return NextResponse.json({ content: "" });
  }
}
