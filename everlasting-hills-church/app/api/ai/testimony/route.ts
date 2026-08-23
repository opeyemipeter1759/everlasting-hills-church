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

Guidelines:
- Improve grammar, spelling, flow, and clarity only
- Preserve the person's own voice, meaning, and every fact/detail exactly as given — do NOT invent new claims, events, or details that weren't mentioned
- Keep it first-person, warm, and sincere — this is someone's real story, not marketing copy
- Keep roughly the same length (do not pad it out or drastically shorten it)
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
