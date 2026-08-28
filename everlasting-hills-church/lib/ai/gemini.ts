import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  // Warn at module load time so developers know immediately what's missing.
  if (process.env.NODE_ENV !== "production") {
    console.warn("[EHC AI] GEMINI_API_KEY is not set — AI features will report themselves unavailable.");
  }
}

/** True when a key is actually present. Whitespace-only counts as absent. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * The answer every AI route gives when there is no key.
 *
 * These routes used to return empty fallback data with a 200, which the UI could
 * only interpret as "the model tried and failed" — so a missing environment
 * variable surfaced to admins as "Gemini couldn't generate a draft. Try
 * rephrasing your idea", and they rephrased forever. An unconfigured server is a
 * different thing from a bad prompt and now says so.
 */
export function aiUnavailable() {
  return NextResponse.json(
    {
      error: {
        code: "AI_NOT_CONFIGURED",
        message: "AI features are switched off — this server has no GEMINI_API_KEY set.",
      },
    },
    { status: 503 },
  );
}

/** A real failure from the model or the network, as opposed to a missing key. */
export function aiFailed(scope: string, err: unknown) {
  console.error(`[AI ${scope}]`, err);
  const detail = err instanceof Error ? err.message : String(err);
  return NextResponse.json(
    {
      error: {
        code: "AI_FAILED",
        // Admin-only surface, so the upstream message is worth showing: an
        // expired key, a retired model name and a quota block all need
        // different fixes and are indistinguishable from "try again".
        message: `Gemini could not complete this request: ${detail}`,
      },
    },
    { status: 502 },
  );
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
