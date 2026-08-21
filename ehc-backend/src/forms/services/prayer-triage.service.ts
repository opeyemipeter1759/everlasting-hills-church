import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

interface TriageResult {
  category: string;
  urgency: 'routine' | 'needs-attention' | 'urgent';
  routeTo: string;
  summary: string;
}

/** Strips a markdown code fence Gemini sometimes wraps JSON in, same as the
 * frontend's lib/ai/gemini.ts parseJSON — kept independent rather than shared
 * since this service has no other reason to depend on the Next.js app. */
function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

/**
 * AI triage for prayer requests (Gemini) — categorizes, flags urgency, suggests
 * a routing team, and writes a PII-free summary for the pastoral team's digest.
 * Runs fire-and-forget right after a PrayerRequest is created; never blocks or
 * fails the public submission. Absent GEMINI_API_KEY = triage silently skipped.
 */
@Injectable()
export class PrayerTriageService {
  private readonly logger = new Logger(PrayerTriageService.name);
  private readonly genAI: GoogleGenerativeAI | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    const apiKey = config.get('GEMINI_API_KEY', { infer: true });
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  /** Triages `request` and saves the result onto PrayerRequest `id`. Swallows
   * every failure (missing key, Gemini error, malformed JSON) — triage is
   * best-effort and must never surface as an error to the submitter. */
  async triageAndSave(id: string, request: string, isAnonymous: boolean): Promise<void> {
    if (!this.genAI) return;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      });

      const prompt = `
You are the pastoral care assistant for Everlasting Hills Church (EHC), Ibadan, Nigeria.
Triage the following prayer request. The submission is ${isAnonymous ? 'anonymous' : 'named'}.

Prayer request text:
"${request}"

Return a JSON object with exactly these keys:
- "category": One of: "Health", "Relationships", "Finance", "Grief", "Salvation", "Purpose", "Family", "Thanksgiving", "Career", "Spiritual Growth", "Other"
- "urgency": One of:
  - "urgent" — the person mentions crisis, danger, suicidal thoughts, severe illness, bereavement, or immediate emergency
  - "needs-attention" — significant emotional distress, major life change, or needs response within 48 hours
  - "routine" — general prayer request with no immediate urgency
- "routeTo": The team name that should handle this (e.g. "Medical Prayer Team", "Marriage & Family Team", "Financial Counselling Team", "Bereavement Support", "General Intercessory Team")
- "summary": A one-sentence neutral summary of the request theme WITHOUT including names, specific people, or identifying details — safe to share in a team digest.

Respond with only valid JSON, no markdown, no explanation.
`.trim();

      const result = await model.generateContent(prompt);
      const data = parseJSON<TriageResult>(result.response.text());

      await this.prisma.prayerRequest.update({
        where: { id },
        data: {
          aiCategory: data.category,
          aiUrgency: data.urgency,
          aiRouteTo: data.routeTo,
          aiSummary: data.summary,
          aiTriagedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn(`Triage failed for prayer request ${id}: ${(err as Error).message}`);
    }
  }
}
