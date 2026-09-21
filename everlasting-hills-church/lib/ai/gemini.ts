import { NextResponse } from "next/server";
import { serverApi, type ApiError } from "@/lib/api/server";

/**
 * The website's AI helpers run their prompts through the API server
 * (POST /ai/generate), which holds the Gemini key. The website needs no key of
 * its own, and the API only answers signed-in admins, so the Gemini quota
 * can't be spent by anyone who finds these routes.
 *
 * Whether AI is switched on is the API's call: it answers 503 when it has no
 * key, and aiFailed() turns that into the AI_NOT_CONFIGURED response below.
 */
export function isAiConfigured(): boolean {
  return true;
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
        message: "AI features are switched off — the API server has no GEMINI_API_KEY set.",
      },
    },
    { status: 503 },
  );
}

/** Thrown when the API reports it has no Gemini key (503). */
class AiNotConfiguredError extends Error {}

/** A real failure from the model or the network, as opposed to a missing key. */
export function aiFailed(scope: string, err: unknown) {
  if (err instanceof AiNotConfiguredError) return aiUnavailable();
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

/**
 * Drop-in for the Gemini SDK model the routes used to hold directly: same
 * `generateContent(prompt)` → `result.response.text()` shape, so no route
 * changed. Model and generation settings live on the API (AiService).
 */
export const flashModel = {
  async generateContent(prompt: string) {
    let text: string;
    try {
      ({ text } = await serverApi.post<{ text: string }>("/ai/generate", { prompt }, { cache: "no-store" }));
    } catch (err) {
      // serverApi rejects with a plain ApiError object, not an Error.
      const apiErr = err as Partial<ApiError>;
      if (apiErr?.status === 503) throw new AiNotConfiguredError(apiErr.message);
      throw new Error(apiErr?.message ?? String(err));
    }
    return { response: { text: () => text } };
  },
};

/** Parse a JSON block out of a Gemini response (strips markdown code fences). */
export function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
