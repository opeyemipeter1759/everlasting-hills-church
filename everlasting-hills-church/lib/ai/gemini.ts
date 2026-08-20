import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  // Warn at module load time so developers know immediately what's missing.
  // In production the API routes gracefully return fallback data when the key is absent.
  if (process.env.NODE_ENV !== "production") {
    console.warn("[EHC AI] GEMINI_API_KEY is not set — AI features will return fallback data.");
  }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

/** Gemini 1.5 Flash — fast, low-cost. Use for all Phase 1 features. */
export const flashModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 1024,
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
