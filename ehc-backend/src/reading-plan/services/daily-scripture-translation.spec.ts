import { DailyScriptureService } from './daily-scripture.service';

/**
 * Members choose the Bible version their shared scripture is quoted in. The
 * verse for the day is the same whichever version they pick.
 */
function makeService() {
  const passages = {
    passage: jest.fn(
      async ({ startVerseId, endVerseId, translationCode }: { startVerseId: number; endVerseId: number; translationCode: string }) => ({
        translation: { code: translationCode, name: `${translationCode} name` },
        reference: 'A reference',
        verses: Array.from({ length: endVerseId - startVerseId + 1 }, (_, index) => ({
          verseId: startVerseId + index,
          text: `verse ${index + 1}`,
        })),
      }),
    ),
  };
  return { service: new DailyScriptureService(passages as never), passages };
}

describe('daily scripture translation', () => {
  it('quotes the version the member asked for', async () => {
    const { service, passages } = makeService();
    const today = await service.today('kjv');

    expect(passages.passage).toHaveBeenCalledWith(expect.objectContaining({ translationCode: 'KJV' }));
    expect(today.translationCode).toBe('KJV');
  });

  it('falls back to the World English Bible when no version is chosen', async () => {
    const { service, passages } = makeService();
    await service.today();
    await service.today('  ');

    expect(passages.passage.mock.calls.map(([args]) => args.translationCode)).toEqual(['WEB', 'WEB']);
  });

  it('keeps the same verse whichever version is chosen', async () => {
    const { service, passages } = makeService();
    await service.today('WEB');
    await service.today('KJV');

    const [web, kjv] = passages.passage.mock.calls.map(([args]) => [args.startVerseId, args.endVerseId]);
    expect(kjv).toEqual(web);
  });
});
