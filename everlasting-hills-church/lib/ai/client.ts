"use client";

/**
 * Calls one of the /api/ai routes and turns a failure into an Error carrying the
 * server's own explanation.
 *
 * The routes answer 503 with AI_NOT_CONFIGURED when the server has no
 * GEMINI_API_KEY, and 502 with the upstream message when the model itself
 * refuses. Both matter to whoever is standing at the screen: one is a deploy
 * setting, the other is a prompt or a quota. Callers should show
 * `(err as Error).message` rather than inventing "try rephrasing your idea",
 * which is what sent admins in circles when the key was simply missing.
 */
export async function postAi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `AI request failed (${res.status}).`;
    try {
      const parsed = (await res.json()) as { error?: { message?: string } };
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      // Non-JSON error body (a proxy page, say) — keep the status-code message.
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
