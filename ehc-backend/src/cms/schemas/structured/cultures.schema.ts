import { z } from 'zod';

/**
 * Structured content for the /cultures page ("Our Culture"), which replaced
 * /beliefs. The design is fixed; the copy and the list of cultures are
 * editable. Each culture has a scripture anchor, its NKJV wording, and an
 * optional original-language key term with its meaning.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const CultureSchema = z.object({
  title: text(80),
  anchorText: text(60),
  verseText: text(1200),
  keyTerm: optionalText(80),
  keyTermMeaning: optionalText(120),
});

export const CulturesSchema = z.object({
  eyebrow: text(60),
  title: text(80),
  accent: text(80),
  lead: text(400),
  heroImage: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine((v) => v.startsWith('/') || /^https?:\/\//i.test(v), 'Must be a relative path or absolute URL')
    .nullable()
    .optional(),
  pillars: z.array(CultureSchema).min(1).max(24),
  cta: z.object({ heading: text(120), body: text(400) }),
});

export type CulturesContent = z.infer<typeof CulturesSchema>;

/** Seeded from the current /cultures page so the editor opens pre-filled with what is live. */
export const DEFAULT_CULTURES: CulturesContent = {
  eyebrow: 'Our Culture',
  title: '12 cultures that shape',
  accent: 'who we are',
  lead: 'Our culture shapes the atmosphere of our church family. It helps each person grow in God and freely experience the blessings He has given us together.',
  heroImage: null,
  pillars: [
    { title: 'The Word of God', anchorText: '2 Tim 3:16–17',
      verseText: 'All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness, that the man of God may be complete, thoroughly equipped for every good work.',
      keyTerm: 'theopneustos', keyTermMeaning: 'God-breathed' },
    { title: 'Prayer', anchorText: 'Luke 18:1',
      verseText: 'Then He spoke a parable to them, that men always ought to pray and not lose heart,',
      keyTerm: 'proskartereo', keyTermMeaning: 'to continue steadfastly' },
    { title: 'Fasting', anchorText: 'Matt 6:16–18',
      verseText: 'Moreover, when you fast, do not be like the hypocrites, with a sad countenance. For they disfigure their faces that they may appear to men to be fasting. Assuredly, I say to you, they have their reward. But you, when you fast, anoint your head and wash your face, so that you do not appear to men to be fasting, but to your Father who is in the secret place; and your Father who sees in secret will reward you openly.',
      keyTerm: 'nesteia', keyTermMeaning: 'fasting' },
    { title: 'Family', anchorText: 'Eph 2:19',
      verseText: 'Now, therefore, you are no longer strangers and foreigners, but fellow citizens with the saints and members of the household of God,',
      keyTerm: 'oikeios · koinonia', keyTermMeaning: 'household members · fellowship' },
    { title: 'Honor', anchorText: 'Rom 12:10',
      verseText: 'Be kindly affectionate to one another with brotherly love, in honor giving preference to one another;',
      keyTerm: null, keyTermMeaning: null },
    { title: 'Service', anchorText: 'Mark 10:43–45',
      verseText: 'Yet it shall not be so among you; but whoever desires to become great among you shall be your servant. And whoever of you desires to be first shall be slave of all. For even the Son of Man did not come to be served, but to serve, and to give His life a ransom for many.',
      keyTerm: 'diakonia', keyTermMeaning: 'service, ministry' },
    { title: 'Discipline', anchorText: '1 Cor 9:24–27',
      verseText: 'Do you not know that those who run in a race all run, but one receives the prize? Run in such a way that you may obtain it. And everyone who competes for the prize is temperate in all things. Now they do it to obtain a perishable crown, but we for an imperishable crown. Therefore I run thus: not with uncertainty. Thus I fight: not as one who beats the air. But I discipline my body and bring it into subjection, lest, when I have preached to others, I myself should become disqualified.',
      keyTerm: 'gymnazo', keyTermMeaning: 'to train' },
    { title: 'Positive Confession', anchorText: 'Heb 10:23',
      verseText: 'Let us hold fast the confession of our hope without wavering, for He who promised is faithful.',
      keyTerm: 'homologia', keyTermMeaning: 'saying the same thing' },
    { title: 'The Supernatural', anchorText: '1 Cor 2:4–5',
      verseText: 'And my speech and my preaching were not with persuasive words of human wisdom, but in demonstration of the Spirit and of power, that your faith should not be in the wisdom of men but in the power of God.',
      keyTerm: 'dynamis', keyTermMeaning: 'power' },
    { title: 'Sincerity and Intentionality', anchorText: 'Phil 1:10',
      verseText: 'that you may approve the things that are excellent, that you may be sincere and without offense till the day of Christ,',
      keyTerm: 'eilikrines', keyTermMeaning: 'tested by sunlight' },
    { title: 'Excellence', anchorText: 'Col 3:23',
      verseText: 'And whatever you do, do it heartily, as to the Lord and not to men,',
      keyTerm: null, keyTermMeaning: null },
    { title: 'Simplicity', anchorText: '2 Cor 11:3',
      verseText: 'But I fear, lest somehow, as the serpent deceived Eve by his craftiness, so your minds may be corrupted from the simplicity that is in Christ.',
      keyTerm: 'haplotes', keyTermMeaning: 'singleness' },
  ],
  cta: {
    heading: 'Come and see for yourself',
    body: 'These are not just words on a page. Join us on a Sunday and experience them in a living family.',
  },
};
