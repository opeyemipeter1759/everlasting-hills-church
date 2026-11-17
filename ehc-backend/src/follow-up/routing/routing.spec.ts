import { SEGMENTS } from './routing';

describe('routing segments', () => {
  it('sends every first-timer to exactly one of Students and Everyone else', () => {
    for (const isStudent of [true, false, null]) {
      const matched = ['STUDENT', 'NOT_STUDENT'].filter((s) => SEGMENTS[s]({ isStudent }));
      expect(matched).toEqual([isStudent === true ? 'STUDENT' : 'NOT_STUDENT']);
    }
  });
});
