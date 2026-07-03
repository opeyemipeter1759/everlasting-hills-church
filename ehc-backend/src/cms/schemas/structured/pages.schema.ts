import { z } from 'zod';

/**
 * Structured content schemas + defaults for the designed public pages. Each is
 * seeded from the current static page so the CMS editor opens pre-filled and the
 * public page keeps its exact design. "Structure doesn't change, content does."
 */

const t = (max: number) => z.string().trim().min(1).max(max);
const CtaSchema = z.object({ heading: t(160), body: t(600) });

// ── Intro (wrapper copy over module-driven content: sermons, events) ───────────
export const IntroSchema = z.object({
  eyebrow: t(60),
  title: t(120),
  subtitle: t(400),
});
export const DEFAULT_SERMONS_INTRO: z.infer<typeof IntroSchema> = {
  eyebrow: 'Sermons',
  title: 'Watch. Listen. Grow.',
  subtitle: 'Recent messages from Everlasting Hills — keep walking in the Word through the week.',
};
export const DEFAULT_EVENTS_INTRO: z.infer<typeof IntroSchema> = {
  eyebrow: 'Gather with us',
  title: 'Events',
  subtitle: "Conferences, special services, and gatherings designed to strengthen faith and build family. We'd love to see you there.",
};

// ── Legal (privacy / terms / cookies) ──────────────────────────────────────────
const LegalSection = z.object({ heading: t(120), body: z.string().trim().min(1).max(4000) });
export const LegalSchema = z.object({
  eyebrow: t(60),
  title: t(80),
  accent: t(80),
  updated: t(40),
  intro: t(1000),
  sections: z.array(LegalSection).min(1).max(20),
});
export const DEFAULT_PRIVACY: z.infer<typeof LegalSchema> = {
  eyebrow: 'Legal',
  title: 'Privacy',
  accent: 'Policy',
  updated: '18 June 2026',
  intro: 'Everlasting Hills Church values your trust. This policy explains what information we collect, why we collect it, and how we keep it safe.',
  sections: [
    { heading: 'Information we collect', body: '- Contact details you provide through our forms (name, email, phone).\n- Membership and attendance records when you join or check in.\n- Prayer requests, testimonies, and messages you choose to share.\n- Basic technical data such as device and browser information.' },
    { heading: 'How we use your information', body: '- To welcome, follow up with, and care for you as part of the church family.\n- To send service updates, event details, and communications you opt into.\n- To improve our website, services, and pastoral care.' },
    { heading: 'How we protect it', body: 'We apply reasonable technical and organisational measures to guard your information. Access is limited to authorised leaders and staff who need it to serve you.' },
    { heading: 'Your choices', body: 'You may request access to, correction of, or deletion of your personal data at any time. You can also opt out of non-essential communications.' },
    { heading: 'Contact us', body: 'For any privacy question or request, email us at hello@everlastinghills.org.' },
  ],
};
export const DEFAULT_TERMS: z.infer<typeof LegalSchema> = {
  eyebrow: 'Legal',
  title: 'Terms of',
  accent: 'Service',
  updated: '18 June 2026',
  intro: 'Welcome to the Everlasting Hills Church website. By using this site and our online services, you agree to the terms below. Please read them carefully.',
  sections: [
    { heading: 'Use of the site', body: 'You agree to use this website lawfully and respectfully, and not to misuse, disrupt, or attempt to gain unauthorised access to any part of it or its underlying systems.' },
    { heading: 'Accounts', body: '- You are responsible for keeping your login details secure.\n- You agree to provide accurate information when you register.\n- We may suspend accounts that breach these terms or are misused.' },
    { heading: 'Submissions and content', body: 'Prayer requests, testimonies, and other content you submit may be read by our pastoral team. Do not submit unlawful, harmful, or content you do not have the right to share.' },
    { heading: 'Giving', body: 'Online giving is processed securely through our payment partner. Gifts are voluntary and, unless stated otherwise, non-refundable. Receipts are issued for your records.' },
    { heading: 'Changes', body: 'We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms.' },
    { heading: 'Contact us', body: 'Questions about these terms? Email us at hello@everlastinghills.org.' },
  ],
};

// ── About ────────────────────────────────────────────────────────────────────
const AboutCard = z.object({ title: t(60), body: t(600) });
export const AboutSchema = z.object({
  eyebrow: t(60),
  title: t(80),
  accent: t(80),
  lead: t(400),
  story: z.object({ heading: t(120), paragraphs: z.array(t(1000)).min(1).max(8) }),
  cards: z.tuple([AboutCard, AboutCard, AboutCard]),
  cta: CtaSchema,
});
export const DEFAULT_ABOUT: z.infer<typeof AboutSchema> = {
  eyebrow: 'About Us',
  title: 'A family rooted in',
  accent: 'the everlasting hills',
  lead: 'We are a church family in Ibadan, Nigeria, pursuing God together and making room for everyone He sends our way.',
  story: {
    heading: 'Built on the blessing of Genesis 49',
    paragraphs: [
      'Everlasting Hills Church began with a small gathering in Ibadan and a single conviction: that the blessing spoken over Joseph in Genesis 49 still rests on a people who will give themselves fully to God.',
      'Over the years we have grown into a vibrant family of believers across ages and backgrounds, united by worship, the word, and a shared longing to see lives transformed.',
      'Today we gather each week to encounter God, to grow in His word, and to send one another out as light into the city and beyond.',
    ],
  },
  cards: [
    { title: 'Our Vision', body: 'To raise a generation that lives unto the utmost bound of the everlasting hills, fruitful, rooted, and overflowing into every sphere of life and society.' },
    { title: 'Our Mission', body: 'To make disciples through the unchanging word, authentic community, and Spirit-led service, so that every person finds a place, a people, and a purpose.' },
    { title: 'Our Heart', body: 'We are a family before we are an organisation. We pursue God together, carry one another, and welcome every newcomer as if welcoming the Lord Himself.' },
  ],
  cta: { heading: 'There is a place for you here', body: 'Plan your first visit, or reach out and let us know you are coming. We would love to welcome you.' },
};

// ── Ministries ─────────────────────────────────────────────────────────────────
export const MinistriesSchema = z.object({
  eyebrow: t(60),
  title: t(80),
  accent: t(80),
  lead: t(400),
  ministries: z.array(z.object({ name: t(80), body: t(400) })).min(1).max(20),
  cta: CtaSchema,
});
export const DEFAULT_MINISTRIES: z.infer<typeof MinistriesSchema> = {
  eyebrow: 'Get Involved',
  title: 'Find where you',
  accent: 'belong',
  lead: 'Everyone has a place and a part to play. Explore our ministry units and discover where God has gifted you to serve.',
  ministries: [
    { name: 'Worship & Music', body: 'Leading the family into the presence of God through song, sound, and a lifestyle of worship.' },
    { name: 'Hospitality & Ushering', body: 'The first smile you meet. Creating a warm, ordered, and welcoming house for everyone who comes.' },
    { name: 'Children', body: 'Discipling the next generation with age-appropriate teaching, care, and a whole lot of joy.' },
    { name: 'Youth & Teens', body: 'Raising a bold generation that loves God, owns their faith, and lives with purpose.' },
    { name: 'Small Groups', body: 'Where the church becomes family. Doing life, growing in the word, and praying together midweek.' },
    { name: 'Media & Tech', body: 'Carrying the message beyond the walls through sound, streaming, design, and storytelling.' },
    { name: 'Evangelism & Outreach', body: 'Taking the love of God into the city, serving the community, and reaching the lost.' },
    { name: 'Prayer & Intercession', body: 'The engine room. Standing in the gap for the church, the city, and the nations.' },
  ],
  cta: { heading: 'Ready to serve?', body: 'Tell us where your heart is drawn and our team will help you take the next step into a ministry unit.' },
};

// ── Visit ────────────────────────────────────────────────────────────────────
export const VisitSchema = z.object({
  eyebrow: t(60),
  title: t(80),
  accent: t(80),
  lead: t(400),
  serviceTimesHeading: t(60),
  serviceTimes: z.array(z.object({ name: t(60), day: t(30), time: t(40) })).min(1).max(8),
  locationHeading: t(60),
  address: t(300),
  expect: z.object({ label: t(60), heading: t(80) }),
  expectItems: z.array(z.object({ title: t(120), body: t(400) })).min(1).max(8),
  cta: CtaSchema,
});
export const DEFAULT_VISIT: z.infer<typeof VisitSchema> = {
  eyebrow: 'Plan a Visit',
  title: 'We saved a',
  accent: 'seat for you',
  lead: 'Thinking about visiting? Here is everything you need to feel at home before you even arrive.',
  serviceTimesHeading: 'Service Times',
  serviceTimes: [
    { name: 'Sunday Service', day: 'Sunday', time: '9:00 AM – 12:00 PM' },
    { name: 'Midweek Service', day: 'Wednesday', time: '5:30 PM – 8:00 PM' },
  ],
  locationHeading: 'Location',
  address: 'Ibadan, Oyo State, Nigeria',
  expect: { label: 'What to Expect', heading: 'Your first visit, simplified' },
  expectItems: [
    { title: 'How long is service?', body: 'Sunday gatherings run about three hours of worship, the word, and prayer. Come as you are and stay as long as you can.' },
    { title: 'What should I wear?', body: 'There is no dress code. Most people come smart-casual, but you are welcome exactly as you are.' },
    { title: 'Will I be noticed?', body: 'Only in the best way. Our hospitality team will welcome you, and there is no pressure to give or sign up for anything.' },
    { title: 'Is there parking?', body: 'Yes. Parking is available on site, and our ushers will help you find your way in.' },
  ],
  cta: { heading: 'Let us know you are coming', body: 'Fill the first-timer form and our welcome team will be looking out for you when you arrive.' },
};
