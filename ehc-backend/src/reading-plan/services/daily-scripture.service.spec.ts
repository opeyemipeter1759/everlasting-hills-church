import { ServiceUnavailableException } from '@nestjs/common';
import { DailyScriptureService } from './daily-scripture.service';
import { verseForDate } from '../verse-of-the-day';

function setup() {
  const passage = jest.fn().mockImplementation(({ startVerseId, endVerseId }) =>
    Promise.resolve({
      reference: 'Test reference',
      translation: { code: 'WEB', name: 'World English Bible' },
      verses: Array.from(
        { length: endVerseId - startVerseId + 1 },
        (_, index) => ({
          verseId: startVerseId + index,
          text: `Stored scripture ${index + 1}.`,
        }),
      ),
    }),
  );
  return { service: new DailyScriptureService({ passage } as never), passage };
}

describe('DailyScriptureService', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('changes with the Lagos date, including the final UTC hour of the previous day', async () => {
    const { service, passage } = setup();
    jest.setSystemTime(new Date('2026-09-11T22:59:59Z'));
    expect((await service.today()).date).toBe('2026-09-11');
    jest.setSystemTime(new Date('2026-09-11T23:00:00Z'));
    expect((await service.today()).date).toBe('2026-09-12');
    const { startVerseId, endVerseId } = verseForDate('2026-09-12');
    expect(passage).toHaveBeenLastCalledWith({
      translationCode: 'WEB',
      startVerseId,
      endVerseId,
    });
  });

  it('uses the complete stored text and translation attribution without generating a quotation', async () => {
    jest.setSystemTime(new Date('2026-01-07T12:00:00Z'));
    const { service } = setup();
    expect(await service.today()).toEqual({
      date: '2026-01-07',
      timezone: 'Africa/Lagos',
      reference: 'Test reference',
      text: 'Stored scripture 1. Stored scripture 2.',
      translationCode: 'WEB',
      translationName: 'World English Bible',
    });
  });

  it('refuses to share an incomplete scripture range', async () => {
    jest.setSystemTime(new Date('2026-01-07T12:00:00Z'));
    const { service, passage } = setup();
    passage.mockResolvedValue({
      reference: 'Proverbs 3:5-6',
      translation: { code: 'WEB', name: 'World English Bible' },
      verses: [{ verseId: 20003005, text: 'Only the first verse exists.' }],
    });
    await expect(service.today()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
