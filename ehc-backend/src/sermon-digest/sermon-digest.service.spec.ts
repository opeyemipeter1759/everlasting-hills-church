import { SermonDigestService, confessionForDay } from './sermon-digest.service';
import { GeminiBusyError } from '../ai/gemini-client';
import type { ServiceVideo } from './youtube-services';

const service = (id: string, state: ServiceVideo['state'] = 'ready'): ServiceVideo => ({
  id,
  title: `Service ${id}`,
  startedAt: new Date('2026-09-20T08:00:00Z'),
  durationSeconds: 7200,
  serviceDay: 'SUNDAY',
  state,
});

const LOCATED = { hasSermon: true, sermonStartSeconds: 3000, sermonEndSeconds: 6000, preacher: 'Pastor A', reason: 'Sermon found' };
const NO_SERMON = { hasSermon: false, sermonStartSeconds: 0, sermonEndSeconds: 0, preacher: '', reason: 'Worship only' };
const DIGEST = {
  sermonTitle: 'Grace that Keeps',
  preacher: 'Pastor A',
  bibleReferences: ['Ephesians 2:8'],
  summary: 'A summary.',
  keyPoints: ['One', 'Two', 'Three'],
  wordOfTheDay: {
    word: 'Grace',
    meaning: 'Undeserved favour.',
    verse: { reference: 'Ephesians 2:8', text: 'For by grace are ye saved through faith' },
    reflection: 'Live from grace.',
    preacherQuote: '',
    confession: ['I am saved by grace.'],
  },
};

const DAILY = { confessions: [['I walk in power today.', 'I expect God to move through me.'], ['I build my expectations on His Word.', 'I pray, I fast, I believe.']] };

function setup(videos: ServiceVideo[], rows: object[] = [], newest: object | null = null) {
  const upsert = jest.fn().mockResolvedValue({});
  const update = jest.fn().mockResolvedValue({});
  const findFirst = jest.fn().mockResolvedValue(newest);
  const prisma = { sermonDigest: { findMany: jest.fn().mockResolvedValue(rows), upsert, findFirst, update } };
  const generate = jest.fn();
  const gemini = { enabled: true, generate };
  const youtube = { configured: true, recentServices: jest.fn().mockResolvedValue(videos) };
  const svc = new SermonDigestService(prisma as never, gemini as never, youtube as never, { get: () => 'tenant' } as never);
  const reply = (v: object) => ({ text: JSON.stringify(v), model: 'gemini-3.8-flash' });
  return { svc, upsert, update, generate, reply };
}

const created = (upsert: jest.Mock, i: number) => upsert.mock.calls[i][0].create;

describe('SermonDigestService.run', () => {
  it('finds the sermon, then summarises only that part of the video', async () => {
    const { svc, generate, upsert, reply } = setup([service('new')]);
    generate.mockResolvedValueOnce(reply(LOCATED)).mockResolvedValueOnce(reply(DIGEST)).mockResolvedValueOnce(reply(DAILY));

    const result = await svc.run();

    expect(result.processed).toEqual([expect.objectContaining({ videoId: 'new', outcome: 'ready' })]);
    const step1 = generate.mock.calls[0][0].input[0];
    expect(step1).toMatchObject({ resolution: 'low', processing: { type: 'static' } });
    expect(step1.processing.start_offset).toBeUndefined();
    expect(generate.mock.calls[1][0].input[0].processing).toMatchObject({ start_offset: '3000s', end_offset: '6000s' });
    expect(created(upsert, 0)).toMatchObject({ status: 'READY', sermonStartSeconds: 3000, preacher: 'Pastor A' });
    // Step 3 is text only: no video goes to Gemini a third time.
    expect(typeof generate.mock.calls[2][0].input).toBe('string');
    expect(created(upsert, 0).dailyConfessions).toEqual(DAILY.confessions);
  });

  it('still publishes the sermon when the daily confessions fail, and writes them on a later run', async () => {
    const { svc, generate, upsert, reply } = setup([service('new')]);
    generate
      .mockResolvedValueOnce(reply(LOCATED))
      .mockResolvedValueOnce(reply(DIGEST))
      .mockRejectedValueOnce(new GeminiBusyError(undefined));
    await svc.run();
    expect(created(upsert, 0)).toMatchObject({ status: 'READY' });
    expect(created(upsert, 0).dailyConfessions).toBeUndefined();
  });

  it('writes the missing daily confessions for the newest sermon', async () => {
    const newest = {
      id: 'row1',
      videoId: 'done',
      videoTitle: 'Service',
      sermonTitle: 'Grace that Keeps',
      summary: 'A summary.',
      keyPoints: ['One'],
      bibleReferences: ['Ephesians 2:8'],
      wordOfTheDay: DIGEST.wordOfTheDay,
      dailyConfessions: null,
    };
    const { svc, generate, update, reply } = setup([service('done')], [{ videoId: 'done', status: 'READY', attempts: 1 }], newest);
    generate.mockResolvedValueOnce(reply(DAILY));
    await svc.run();
    expect(generate).toHaveBeenCalledTimes(1); // the sermon itself isn't looked at again
    expect(update).toHaveBeenCalledWith({ where: { id: 'row1' }, data: { dailyConfessions: DAILY.confessions } });
  });

  it('leaves the daily confessions alone once they exist', async () => {
    const { svc, generate } = setup([], [], { id: 'row1', videoId: 'done', dailyConfessions: DAILY.confessions });
    await svc.run();
    expect(generate).not.toHaveBeenCalled();
  });

  it('rejects and remembers a video without a sermon, then tries the next newest', async () => {
    const { svc, generate, upsert, reply } = setup([service('worship'), service('older')]);
    generate
      .mockResolvedValueOnce(reply(NO_SERMON))
      .mockResolvedValueOnce(reply(LOCATED))
      .mockResolvedValueOnce(reply(DIGEST));

    await svc.run();

    expect(created(upsert, 0)).toMatchObject({ videoId: 'worship', status: 'REJECTED' });
    expect(created(upsert, 1)).toMatchObject({ videoId: 'older', status: 'READY' });
  });

  it('rejects preaching under 10 minutes', async () => {
    const { svc, generate, upsert, reply } = setup([service('brief')]);
    generate.mockResolvedValueOnce(reply({ ...LOCATED, sermonEndSeconds: 3000 + 9 * 60 }));
    await svc.run();
    expect(created(upsert, 0)).toMatchObject({ status: 'REJECTED', reason: expect.stringMatching(/SERMON_TOO_SHORT/) });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('never sends a video twice: skips rejected ones and stops at the newest READY one', async () => {
    const { svc, generate } = setup(
      [service('rejected'), service('done'), service('older')],
      [
        { videoId: 'rejected', status: 'REJECTED', attempts: 1 },
        { videoId: 'done', status: 'READY', attempts: 1 },
      ],
    );
    await svc.run();
    expect(generate).not.toHaveBeenCalled();
  });

  it('leaves a live or processing service for the next run without failing', async () => {
    const { svc, generate, upsert } = setup([service('live', 'pending')]);
    await expect(svc.run()).resolves.toEqual({ processed: [] });
    expect(generate).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('records nothing when Gemini is busy, so the next run tries the same video', async () => {
    const { svc, generate, upsert } = setup([service('new'), service('older')]);
    generate.mockRejectedValue(new GeminiBusyError(undefined));
    const result = await svc.run();
    expect(result.processed).toEqual([expect.objectContaining({ videoId: 'new', outcome: 'busy' })]);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('records a failure (to retry later) when the answer is malformed', async () => {
    const { svc, generate, upsert } = setup([service('new')]);
    generate.mockResolvedValueOnce({ text: 'not json', model: 'm' });
    await svc.run();
    expect(created(upsert, 0)).toMatchObject({ status: 'FAILED', attempts: 1 });
  });

  it('checks at most the 5 newest services', async () => {
    const videos = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => service(id));
    const { svc, generate, reply } = setup(videos);
    generate.mockResolvedValue(reply(NO_SERMON));
    await svc.run();
    expect(generate).toHaveBeenCalledTimes(5);
  });
});

describe('confessionForDay', () => {
  const original = ['I am saved by grace.'];
  const daily = [['Day two line.', 'More.'], ['Day three line.', 'More.']];
  // A Sunday service at 10:00 in Lagos (09:00 UTC).
  const service = new Date('2026-09-20T09:00:00Z');

  it('shows the sermon’s own confession on the service day', () => {
    expect(confessionForDay(original, daily, service, new Date('2026-09-20T21:00:00Z'))).toEqual({ lines: original, day: 0 });
  });

  it('shows a different confession each day after, changing at Lagos midnight', () => {
    // 23:30 UTC on the 20th is already 00:30 on the 21st in Lagos.
    expect(confessionForDay(original, daily, service, new Date('2026-09-20T23:30:00Z')).lines).toEqual(daily[0]);
    expect(confessionForDay(original, daily, service, new Date('2026-09-22T12:00:00Z')).lines).toEqual(daily[1]);
  });

  it('goes round again if the next service is late', () => {
    expect(confessionForDay(original, daily, service, new Date('2026-09-23T12:00:00Z')).lines).toEqual(original);
  });

  it('keeps the sermon’s own confession before the daily ones are written', () => {
    expect(confessionForDay(original, null, service, new Date('2026-09-22T12:00:00Z')).lines).toEqual(original);
  });
});
