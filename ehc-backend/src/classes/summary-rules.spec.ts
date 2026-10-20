import { SUMMARY_MAX_CHARS, SUMMARY_MIN_CHARS, normalizeSummary, summaryProblem, summarySchema } from './summary-rules';

/** Varied, real-looking words: enough that no one word dominates. */
const VOCAB = (
  'grace faith family belong house prayer word spirit church love honour walk light shepherd hope mercy truth ' +
  'community fellowship scripture service people table welcome promise strength patience kindness gentle ' +
  'humble teach learn follow trust obey serve give share gather worship praise thanks rest peace joy ' +
  'courage purpose calling growth root plant water harvest season'
).split(' ');

function prose(chars: number): string {
  let out = '';
  let i = 0;
  while (out.length < chars) out += `${VOCAB[i++ % VOCAB.length]} `;
  return out.trim().slice(0, chars).replace(/\s\S*$/, (m) => (m.trim().length < 3 ? '' : m));
}

describe('summaryProblem', () => {
  it('rejects 299 characters and accepts 300 (after trimming)', () => {
    const exact = prose(320).slice(0, SUMMARY_MIN_CHARS).trimEnd();
    const padded = `   ${exact}   `;
    expect(normalizeSummary(exact).length).toBeGreaterThanOrEqual(SUMMARY_MIN_CHARS - 1);
    // Build texts of exactly 299 and 300 normalized characters from the same words.
    const base = prose(400);
    const at = (n: number) => base.slice(0, n).replace(/\s+$/, '');
    let n300 = 300;
    while (normalizeSummary(at(n300)).length < 300) n300++;
    const three00 = at(n300);
    expect(normalizeSummary(three00).length).toBe(300);
    expect(summaryProblem(three00)).toBeNull();
    expect(summaryProblem(`   ${three00}   `)).toBeNull();
    expect(summaryProblem(three00.slice(0, -1))).toBe('too_short');
    expect(padded.length).toBeGreaterThan(exact.length);
  });

  it('counts repeated whitespace as one space', () => {
    const spaced = prose(300).replace(/ /g, '      ');
    expect(normalizeSummary(spaced)).toBe(normalizeSummary(prose(300)));
    expect(summaryProblem(`${prose(280)}${' '.repeat(200)}`)).toBe('too_short');
  });

  it('rejects filler: one word repeated, or very few words', () => {
    expect(summaryProblem('lesson '.repeat(60))).toBe('too_thin');
    expect(summaryProblem(`${'a'.repeat(310)}`)).toBe('too_thin');
    const mostlyOne = `${'grace '.repeat(30)}${prose(280)}`;
    expect(summaryProblem(mostlyOne)).toBe('too_thin');
  });

  it('rejects more than the maximum', () => {
    expect(summaryProblem(prose(SUMMARY_MAX_CHARS + 200))).toBe('too_long');
  });

  it('accepts an honest summary', () => {
    expect(summaryProblem(prose(500))).toBeNull();
  });
});

describe('summarySchema', () => {
  it('carries the same messages', () => {
    const short = summarySchema.safeParse('Too short.');
    expect(short.success).toBe(false);
    if (!short.success) expect(short.error.issues[0].message).toMatch(/at least 300 characters/);
    expect(summarySchema.safeParse(prose(500)).success).toBe(true);
  });
});
