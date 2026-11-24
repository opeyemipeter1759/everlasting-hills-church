import { fillMissing } from './cms-page-core.service';
import { DEFAULT_HOME } from '../schemas/structured/pages.schema';

describe('fillMissing', () => {
  it('fills a whole missing section from defaults', () => {
    expect(fillMissing({}, DEFAULT_HOME)).toEqual(DEFAULT_HOME);
    expect(fillMissing({ blocks: [] }, DEFAULT_HOME)).toMatchObject(DEFAULT_HOME);
  });

  it('fills only absent nested keys and keeps saved values', () => {
    const saved = { setman: { name: 'Pastor Ade', photo: null, headline: '', cta: { label: 'Hi' } } };
    const out = fillMissing(saved, DEFAULT_HOME) as typeof DEFAULT_HOME;
    expect(out.setman.name).toBe('Pastor Ade');
    expect(out.setman.photo).toBeNull();
    expect(out.setman.headline).toBe('');
    expect(out.setman.cta).toEqual({ label: 'Hi', href: DEFAULT_HOME.setman.cta.href });
    expect(out.setman.paragraphs).toEqual(DEFAULT_HOME.setman.paragraphs);
    expect(out.setman.visible).toBe(true);
  });
});
