import { YouTubeVideoItem, lagosServiceDay, parseIsoDuration, toServiceVideo } from './youtube-services';

function video(
  over: Partial<YouTubeVideoItem['snippet']> & { duration?: string; live?: boolean; privacy?: string; upload?: string } = {},
): YouTubeVideoItem {
  const { duration = 'PT2H5M', live = false, privacy = 'public', upload = 'processed', ...snippet } = over;
  return {
    id: 'vid',
    snippet: { title: 'Sunday Service', publishedAt: '2026-09-20T09:00:00Z', liveBroadcastContent: 'none', ...snippet },
    contentDetails: { duration },
    status: { privacyStatus: privacy, uploadStatus: upload },
    ...(live && { liveStreamingDetails: { actualStartTime: '2026-09-20T08:00:00Z', actualEndTime: '2026-09-20T10:30:00Z' } }),
  };
}

describe('toServiceVideo', () => {
  it('accepts a long public upload and a past live stream', () => {
    expect(toServiceVideo(video(), false)).toMatchObject({ state: 'ready', durationSeconds: 7500, serviceDay: 'SUNDAY' });
    expect(toServiceVideo(video({ duration: 'PT15M', live: true }), false)).toMatchObject({ state: 'ready' });
  });

  it('never picks Shorts, even from the services playlist', () => {
    expect(toServiceVideo(video({ duration: 'PT58S' }), true)).toBeNull();
  });

  it('skips short uploads unless they come from the services playlist', () => {
    expect(toServiceVideo(video({ duration: 'PT12M' }), false)).toBeNull();
    expect(toServiceVideo(video({ duration: 'PT12M' }), true)).toMatchObject({ state: 'ready' });
  });

  it.each([
    'Sunday service highlights',
    'Worship song | Hallelujah',
    'Easter trailer',
    'Church announcement',
    'Sermon clip #shorts',
    'Official Music Video',
    'LOVE LIVES HERE. #gospelshorts #music',
  ])('skips "%s" by its title', (title) => {
    expect(toServiceVideo(video({ title }), true)).toBeNull();
  });

  it('waits (pending) while a service is live, scheduled or processing', () => {
    expect(toServiceVideo(video({ liveBroadcastContent: 'live', duration: 'P0D' }), false)).toMatchObject({ state: 'pending' });
    expect(toServiceVideo(video({ liveBroadcastContent: 'upcoming' }), false)).toMatchObject({ state: 'pending' });
    expect(toServiceVideo(video({ upload: 'uploaded' }), false)).toMatchObject({ state: 'pending' });
  });

  it('only takes Sunday and Wednesday services', () => {
    expect(toServiceVideo(video({ publishedAt: '2026-09-24T18:00:00Z' }), false)).toBeNull(); // Thursday home cell
    expect(toServiceVideo(video({ publishedAt: '2026-09-23T17:00:00Z' }), false)).toMatchObject({ serviceDay: 'WEDNESDAY' });
  });

  it('skips videos Gemini cannot watch', () => {
    expect(toServiceVideo(video({ privacy: 'unlisted' }), false)).toBeNull();
  });
});

describe('helpers', () => {
  it('parses ISO durations', () => {
    expect(parseIsoDuration('PT1H32M5S')).toBe(5525);
    expect(parseIsoDuration('P0D')).toBe(0);
    expect(parseIsoDuration(undefined)).toBe(0);
  });

  it('names the service day in Lagos time', () => {
    expect(lagosServiceDay(new Date('2026-09-23T17:00:00Z'))).toBe('WEDNESDAY');
    expect(lagosServiceDay(new Date('2026-09-19T23:30:00Z'))).toBe('SUNDAY'); // 00:30 Sunday in Lagos
  });
});
