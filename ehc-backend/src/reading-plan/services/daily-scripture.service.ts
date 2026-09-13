import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { BiblePassageService } from './bible-passage.service';
import { localDate } from '../local-date.util';
import { verseForDate } from '../verse-of-the-day';

export const SCRIPTURE_TIMEZONE = 'Africa/Lagos';

@Injectable()
export class DailyScriptureService {
  constructor(private readonly passages: BiblePassageService) {}

  async today() {
    const date = localDate(SCRIPTURE_TIMEZONE);
    const { startVerseId, endVerseId } = verseForDate(date);
    const passage = await this.passages.passage({
      translationCode: 'WEB',
      startVerseId,
      endVerseId,
    });

    // Every curated selection stays within one chapter. Never share a partial
    // quotation if the scripture corpus is incomplete.
    if (
      passage.verses.length !== endVerseId - startVerseId + 1 ||
      passage.verses.some(
        (verse, index) =>
          verse.verseId !== startVerseId + index || !verse.text.trim(),
      )
    ) {
      throw new ServiceUnavailableException(
        'Today’s scripture is temporarily unavailable',
      );
    }

    return {
      date,
      timezone: SCRIPTURE_TIMEZONE,
      reference: passage.reference,
      text: passage.verses.map((verse) => verse.text).join(' '),
      translationCode: passage.translation.code,
      translationName: passage.translation.name,
    };
  }
}
