import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GeminiBusyError, GeminiClient } from './gemini-client';

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
    if (!this.gemini.enabled) {
      throw new ServiceUnavailableException('AI features are switched off — this server has no GEMINI_API_KEY set.');
    }

    try {
      const { text } = await this.gemini.generate({ input: prompt });
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
