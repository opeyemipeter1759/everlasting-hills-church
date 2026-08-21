import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  // Warn at module load time so developers know immediately what's missing.
  // In production the API routes gracefully return fallback data when the key is absent.
  if (process.env.NODE_ENV !== "production") {
    console.warn("[EHC AI] GEMINI_API_KEY is not set — AI features will return fallback data.");
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

/** Gemini 3.6 Flash — fast, low-cost. Use for all Phase 1 features.
 * (gemini-1.5-flash and gemini-2.5-flash were both retired by Google — confirmed
 * live against the API on 2026-08-21; gemini-3.6-flash is the current replacement.) */
export const flashModel = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
  generationConfig: {
    temperature: 0.4,
    // 3.6 Flash spends part of this budget on internal "thinking" before writing
    // output (observed ~390 tokens on a two-sentence draft) — headroom above the
    // old 1024 so a real-length announcement doesn't get cut off mid-JSON.
    maxOutputTokens: 2048,
  },
});

/** Parse a JSON block out of a Gemini response (strips markdown code fences). */
export function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
