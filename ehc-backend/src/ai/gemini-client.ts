import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';

const INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

/**
 * Models tried in order for the website's text helpers. Google sheds load one
 * model at a time — while one answers 503 "high demand" another is usually
 * free — so a request walks down this list instead of waiting on a busy one.
 * The lite models come last: a plainer answer beats no answer.
 * GEMINI_MODELS (comma-separated) replaces this list.
 */
export const DEFAULT_TEXT_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

/** How long a model is left alone after it turns us away, when Google doesn't say. */
const DEFAULT_BUSY_COOLDOWN_MS = 30_000;
/** A model Google no longer serves (404) is skipped for an hour, not retried per request. */
const MISSING_MODEL_COOLDOWN_MS = 60 * 60_000;

/** A text or video part of an Interactions API input. */
export type GeminiContent =
  | { type: 'text'; text: string }
  | {
      type: 'video';
      uri: string;
      resolution?: 'low' | 'medium' | 'high';
      /** Offsets are seconds with an "s" suffix, e.g. "1250s". */
      processing?: { type: 'static'; start_offset?: string; end_offset?: string; fps?: number };
    };

export interface GeminiCall {
  input: string | GeminiContent[];
  /** JSON schema the answer must follow; the answer text is then JSON. */
  schema?: Record<string, unknown>;
  /**
   * Includes the model's thinking, which comes out of the same allowance — too
   * low and the answer is cut off mid-JSON.
   */
  maxOutputTokens?: number;
  /** How hard the model thinks first; lower is faster and cheaper. Model default when unset. */
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  /** Models to try, in order. Defaults to the text-helper list. */
  models?: readonly string[];
  /** Per-attempt limit; a long video takes far longer than a text prompt. */
  timeoutMs?: number;
  /** How long to wait for a busy model to come back once every model has refused. */
  waitBudgetMs?: number;
}

/**
 * "busy": Google's capacity or rate limit, or the network — another model or a
 *   later try will likely work.
 * "missing": the model name isn't served (retired or never available to this key).
 * "rejected": the request itself was refused (bad key, bad input) — retrying
 *   anywhere would fail the same way.
 */
export type GeminiErrorKind = 'busy' | 'missing' | 'rejected';

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly kind: GeminiErrorKind,
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/** Every model was busy (or missing) for the whole wait budget. */
export class GeminiBusyError extends Error {
  constructor(readonly lastError: GeminiError | undefined) {
    super(`Every Gemini model was busy${lastError ? ` (last: ${lastError.message})` : ''}`);
    this.name = 'GeminiBusyError';
  }
}

/**
 * The one place the API server talks to Gemini (the Interactions API, over
 * plain HTTPS). The key never leaves this server.
 *
 * Google answers 503 "currently experiencing high demand" with a
 * `retry-after: 30` header, and free-tier keys also hit 429 per-minute limits.
 * Retrying the same model a second later can't beat a 30-second back-off, so a
 * refused model is put in a cooldown for as long as Google asks and the call
 * moves straight on to the next model. Cooldowns are shared by every request on
 * this instance, so after one 503 the next requests skip that model outright.
 */
@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly apiKey: string | undefined;
  readonly textModels: readonly string[];
  private readonly coolUntil = new Map<string, number>();

  constructor(config: ConfigService<Env, true>) {
    this.apiKey = config.get('GEMINI_API_KEY', { infer: true });
    const override = config.get('GEMINI_MODELS', { infer: true });
    const names = override
      ?.split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    this.textModels = names?.length ? names : DEFAULT_TEXT_MODELS;
  }

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(call: GeminiCall): Promise<{ text: string; model: string }> {
    if (!this.apiKey) throw new GeminiError('GEMINI_API_KEY is not set', 'rejected', 503);
    const models = call.models ?? this.textModels;
    const deadline = Date.now() + (call.waitBudgetMs ?? 8_000);
    let lastError: GeminiError | undefined;

    for (;;) {
      for (const model of models) {
        if ((this.coolUntil.get(model) ?? 0) > Date.now()) continue;
        try {
          const text = await this.request(model, call);
          if (model !== models[0]) this.logger.log(`Gemini answered on fallback model ${model}`);
          return { text, model };
        } catch (err) {
          if (!(err instanceof GeminiError) || err.kind === 'rejected') throw err;
          lastError = err;
          const cooldown = err.kind === 'missing' ? MISSING_MODEL_COOLDOWN_MS : (err.retryAfterMs ?? DEFAULT_BUSY_COOLDOWN_MS);
          this.coolUntil.set(model, Date.now() + cooldown);
          const log = err.kind === 'missing' ? 'error' : 'warn';
          this.logger[log](`Gemini ${model} ${err.kind} (${err.status}), resting it ${Math.round(cooldown / 1000)}s: ${err.message}`);
        }
      }

      // Everything is cooling down: wait for the first model to come back if
      // that fits the budget, otherwise give up.
      const soonest = Math.min(...models.map((m) => this.coolUntil.get(m) ?? 0));
      if (soonest > deadline) throw new GeminiBusyError(lastError);
      await new Promise((resolve) => setTimeout(resolve, Math.max(soonest - Date.now(), 250)));
    }
  }

  private async request(model: string, call: GeminiCall): Promise<string> {
    const body = {
      model,
      input: call.input,
      store: false,
      generation_config: {
        max_output_tokens: call.maxOutputTokens ?? 8192,
        ...(call.thinkingLevel && { thinking_level: call.thinkingLevel }),
      },
      ...(call.schema && { response_format: { type: 'text', mime_type: 'application/json', schema: call.schema } }),
    };

    let res: Response;
    try {
      res = await fetch(INTERACTIONS_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey as string },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(call.timeoutMs ?? 60_000),
      });
    } catch (err) {
      // Timeouts and dropped connections: worth another model or a later try.
      throw new GeminiError(`network: ${(err as Error).message}`, 'busy', 0, 5_000);
    }

    const payload = (await res.json().catch(() => null)) as InteractionResponse | null;
    if (!res.ok) {
      const message = payload?.error?.message ?? res.statusText;
      throw new GeminiError(message, errorKind(res.status), res.status, retryAfterMs(res, message));
    }

    // "incomplete" is an answer cut off at max_output_tokens: never pass on half a JSON object.
    if (payload?.status && payload.status !== 'completed') {
      throw new GeminiError(`Gemini stopped early (status: ${payload.status})`, 'rejected', 502);
    }
    const output = [...(payload?.steps ?? [])].reverse().find((s) => s.type === 'model_output');
    const text = (output?.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw new GeminiError(`Gemini returned no text (status: ${payload?.status ?? 'unknown'})`, 'rejected', 502);
    }
    return text;
  }
}

interface InteractionResponse {
  status?: string;
  error?: { message?: string; code?: string };
  steps?: { type: string; content?: { type: string; text?: string }[] }[];
}

export function errorKind(status: number): GeminiErrorKind {
  if (status === 404) return 'missing';
  if (status === 408 || status === 429 || status >= 500) return 'busy';
  return 'rejected';
}

/** Google's own wait: the retry-after header, or "Please retry in 26s" in the message. */
function retryAfterMs(res: Response, message: string): number | undefined {
  const header = Number(res.headers.get('retry-after'));
  if (Number.isFinite(header) && header > 0) return header * 1000;
  const match = /retry in (\d+(?:\.\d+)?)s/i.exec(message);
  return match ? Number(match[1]) * 1000 : undefined;
}

/** Parses a JSON answer, tolerating a markdown code fence around it. */
export function parseGeminiJson<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
