import { SermonDigestService } from './sermon-digest.service';
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

function setup(videos: ServiceVideo[], rows: object[] = []) {
  const upsert = jest.fn().mockResolvedValue({});
  const prisma = { sermonDigest: { findMany: jest.fn().mockResolvedValue(rows), upsert } };
  const generate = jest.fn();
  const gemini = { enabled: true, generate };
  const youtube = { configured: true, recentServices: jest.fn().mockResolvedValue(videos) };
  const svc = new SermonDigestService(prisma as never, gemini as never, youtube as never, { get: () => 'tenant' } as never);
  const reply = (v: object) => ({ text: JSON.stringify(v), model: 'gemini-3.8-flash' });
  return { svc, upsert, generate, reply };
}

const created = (upsert: jest.Mock, i: number) => upsert.mock.calls[i][0].create;

describe('SermonDigestService.run', () => {
  it('finds the sermon, then summarises only that part of the video', async () => {
    const { svc, generate, upsert, reply } = setup([service('new')]);
    generate.mockResolvedValueOnce(reply(LOCATED)).mockResolvedValueOnce(reply(DIGEST));

    const result = await svc.run();

    expect(result.processed).toEqual([expect.objectContaining({ videoId: 'new', outcome: 'ready' })]);
    const step1 = generate.mock.calls[0][0].input[0];
    expect(step1).toMatchObject({ resolution: 'low', processing: { type: 'static' } });
    expect(step1.processing.start_offset).toBeUndefined();
    expect(generate.mock.calls[1][0].input[0].processing).toMatchObject({ start_offset: '3000s', end_offset: '6000s' });
    expect(created(upsert, 0)).toMatchObject({ status: 'READY', sermonStartSeconds: 3000, preacher: 'Pastor A' });
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
