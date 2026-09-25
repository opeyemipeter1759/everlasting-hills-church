import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiClient, parseGeminiJson } from '../../ai/gemini-client';

interface TriageResult {
  category: string;
  urgency: 'routine' | 'needs-attention' | 'urgent';
  routeTo: string;
  summary: string;
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClient,
  ) {}

  /** Triages `request` and saves the result onto PrayerRequest `id`. Swallows
   * every failure (missing key, Gemini error, malformed JSON) — triage is
   * best-effort and must never surface as an error to the submitter. */
  async triageAndSave(id: string, request: string, isAnonymous: boolean): Promise<void> {
    if (!this.gemini.enabled) return;

    try {
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

      const { text } = await this.gemini.generate({ input: prompt });
      const data = parseGeminiJson<TriageResult>(text);

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
