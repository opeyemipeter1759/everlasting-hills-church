import { SermonType } from '@prisma/client';
import { serializeSermon, serializeSermonForListeners } from './sermon-serialization.util';

const series = {
  id: 's1',
  type: SermonType.SERIES,
  audioUrl: null,
  audioDuration: null,
  thumbnailUrl: 'https://x.test/series.jpg',
  Episodes: [
    { id: 'e1', title: 'Part 1', url: 'https://x.test/1.mp3', duration: 1200, order: 0, thumbnailUrl: 'https://x.test/1.jpg' },
    { id: 'e2', title: 'Part 2', url: 'https://x.test/2.mp3', duration: 1800, order: 1, thumbnailUrl: null },
  ],
};

describe('sermon serialization', () => {
  it("gives listeners a series' first episode to play, and its whole length", () => {
    const out = serializeSermonForListeners(series);
    expect(out.audioUrl).toBe('https://x.test/1.mp3');
    expect(out.audioDuration).toBe(3000);
    expect(out.episodes.map((e) => e.thumbnailUrl)).toEqual(['https://x.test/1.jpg', null]);
  });

  it('keeps the raw row for admins, so the edit form never treats episode one as a single file', () => {
    const out = serializeSermon(series);
    expect(out.audioUrl).toBeNull();
    expect(out.episodes).toHaveLength(2);
  });

  it('leaves a single sermon alone', () => {
    const single = { id: 's2', type: SermonType.SINGLE, audioUrl: 'https://x.test/a.mp3', audioDuration: 900, Episodes: [] };
    expect(serializeSermonForListeners(single)).toMatchObject({ audioUrl: 'https://x.test/a.mp3', audioDuration: 900, episodes: [] });
  });
});
