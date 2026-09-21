import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import type { Env } from '../config/env.validation';

/**
 * Runs Gemini prompts for the website's AI helpers (announcement drafts,
 * first-timer analysis, dashboard insights, sermon summaries, testimony
 * polish). The key lives only here, on the API server, so the website needs
 * no key of its own and nothing secret ships with the frontend.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model: GenerativeModel | null;

  constructor(config: ConfigService<Env, true>) {
    const apiKey = config.get('GEMINI_API_KEY', { infer: true });
    // Same model and settings the website used when it called Gemini itself.
    this.model = apiKey
      ? new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: 'gemini-3.6-flash',
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        })
      : null;
  }

  async generate(prompt: string): Promise<{ text: string }> {
    if (!this.model) {
      throw new ServiceUnavailableException('AI features are switched off — this server has no GEMINI_API_KEY set.');
    }
    try {
      const result = await this.model.generateContent(prompt);
      return { text: result.response.text() };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Gemini request failed: ${detail}`);
      throw new BadGatewayException(`Gemini could not complete this request: ${detail}`);
    }
  }
}
