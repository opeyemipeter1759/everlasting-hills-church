import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GeminiBusyError, GeminiClient, parseGeminiJson, type GeminiCall } from './gemini-client';
import { helpChatPrompt } from './help-chat-prompt';
import { HELP_CHAT_SCHEMA, helpChatAnswer } from './help-chat-schema';
import { titlesPrompt, writingPrompt, type WritingAction } from './writing-prompts';
import { REWRITE_SCHEMA, rewriteAnswer, TITLES_SCHEMA, titlesAnswer } from './writing-schemas';

export type WritingAssistResult =
  | { action: Exclude<WritingAction, 'titles'>; text: string; notes: string[] }
  | { action: 'titles'; titles: { title: string; subtitle: string }[] };

/**
 * Runs Gemini prompts for the website's AI helpers (announcement drafts,
 * first-timer analysis, dashboard insights, sermon summaries, testimony
 * polish). The key lives only here, on the API server, so the website needs
 * no key of its own and nothing secret ships with the frontend.
 *
 * GeminiClient moves on to another model whenever one is busy, so AI_BUSY only
 * comes back when every model stayed busy for the whole wait.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly gemini: GeminiClient) {}

  async generate(prompt: string): Promise<{ text: string }> {
    const { text } = await this.call({ input: prompt });
    return { text };
  }

  /** The member article editor's helpers: fixed instructions, structured answers. */
  async writingAssist(
    action: WritingAction,
    text: string,
    context: { title?: string; subtitle?: string } = {},
  ): Promise<WritingAssistResult> {
    // Long stories need room for the whole rewrite plus the model's thinking.
    const sizing = { maxOutputTokens: 32_768, thinkingLevel: 'low' as const, timeoutMs: 100_000, waitBudgetMs: 15_000 };
    if (action === 'titles') {
      const { text: answer } = await this.call({ input: titlesPrompt(text, context), schema: TITLES_SCHEMA, ...sizing, maxOutputTokens: 4_096 });
      return { action, titles: this.parse(titlesAnswer, answer).titles };
    }
    const { text: answer } = await this.call({ input: writingPrompt(action, text, context), schema: REWRITE_SCHEMA, ...sizing });
    const parsed = this.parse(rewriteAnswer, answer);
    if (!parsed.text.trim()) throw new BadGatewayException('Gemini returned an empty answer. Please try again.');
    return { action, text: parsed.text, notes: parsed.notes };
  }

  /** HillsBot: answers an in-app help question, grounded in the page map — open to every role. */
  async helpChat(question: string, context: { pathname: string; role: string }) {
    const sizing = { maxOutputTokens: 2_048, thinkingLevel: 'low' as const, timeoutMs: 20_000, waitBudgetMs: 6_000 };
    const { text } = await this.call({ input: helpChatPrompt(question, context), schema: HELP_CHAT_SCHEMA, ...sizing });
    return this.parse(helpChatAnswer, text);
  }

  private parse<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, answer: string): T {
    let raw: unknown;
    try {
      raw = parseGeminiJson(answer);
    } catch {
      raw = undefined;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      this.logger.error(`Gemini answer did not match the expected shape: ${answer.slice(0, 300)}`);
      throw new BadGatewayException('Gemini returned an answer that could not be read. Please try again.');
    }
    return result.data;
  }

  private async call(call: GeminiCall): Promise<{ text: string }> {
    if (!this.gemini.enabled) {
      throw new ServiceUnavailableException('AI features are switched off — this server has no GEMINI_API_KEY set.');
    }

    try {
      const { text } = await this.gemini.generate(call);
      return { text };
    } catch (err) {
      if (err instanceof GeminiBusyError) {
        this.logger.error(err.message);
        // AI_BUSY lets the website say "busy, try again" rather than "something
        // went wrong" — it is Google's capacity, not a fault here.
        throw new BadGatewayException({
          message: "Google's Gemini AI is very busy right now and couldn't take this request. Please try again in a minute.",
          error: 'AI_BUSY',
        });
      }
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Gemini request failed: ${detail}`);
      throw new BadGatewayException(`Gemini could not complete this request: ${detail}`);
    }
  }
}
