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
  eyebrow: 'Sermon Library',
  title: 'Browse sermons by category',
  subtitle: 'A fuller library view inspired by music apps: compact cards, clear categories, and quick access to audio or video messages.',
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

// ── Give (bank-transfer accounts) ──────────────────────────────────────────────
const AccountSchema = z.object({
  bank: t(60),
  purpose: t(80),
  number: t(40),
  currency: t(8),
});
export const GiveSchema = z.object({
  eyebrow: t(60),
  titleTop: t(40),
  accentTop: t(40),
  titleBottom: t(40),
  accentBottom: t(40),
  subtitle: t(400),
  sectionLabel: t(60),
  headingLead: t(60),
  headingAccent: t(60),
  accountName: t(120),
  local: z.array(AccountSchema).min(1).max(20),
  domiciliary: z.array(AccountSchema).max(20),
});
export const DEFAULT_GIVE: z.infer<typeof GiveSchema> = {
  eyebrow: 'Give',
  titleTop: 'Your',
  accentTop: 'Generosity',
  titleBottom: 'Our',
  accentBottom: 'Mission',
  subtitle: 'Your gifts fuel worship, outreach, and pastoral care, carrying the gospel unto the utmost bound of the everlasting hills.',
  sectionLabel: 'Ways to Give',
  headingLead: 'Give by',
  headingAccent: 'bank transfer',
  accountName: 'EVERLASTING HEIGHTS MINISTRIES',
  local: [
    { bank: 'Globus Bank', purpose: 'Tithe & Offering', number: '2007044595', currency: 'NGN' },
    { bank: 'Globus Bank', purpose: 'Rent', number: '2007060182', currency: 'NGN' },
    { bank: 'Globus Bank', purpose: 'Building / Project', number: '2007060223', currency: 'NGN' },
  ],
  domiciliary: [
    { bank: 'Globus Bank', purpose: 'USD Domiciliary', number: '1000596249', currency: 'USD' },
    { bank: 'Globus Bank', purpose: 'GBP Domiciliary', number: '1000596311', currency: 'GBP' },
  ],
};

// ── Contact (hero copy; contact details come from site settings) ────────────────
export const ContactSchema = z.object({
  eyebrow: t(60),
  title: t(80),
  accent: t(80),
  subtitle: t(400),
});
export const DEFAULT_CONTACT: z.infer<typeof ContactSchema> = {
  eyebrow: 'Get in Touch',
  title: 'Connect',
  accent: 'With Us',
  subtitle: 'We would love to hear from you. Reach out — there is always a place for you in the Everlasting Hills family.',
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

// ── Ministries (landing: hero + section copy + four flip-card groups) ───────────
const MINISTRY_SLUGS = ['mens', 'womens', 'teens', 'couples'] as const;
const GroupSchema = z.object({
  slug: z.enum(MINISTRY_SLUGS),
  name: t(60),
  body: t(400),
  verseRef: t(60),
  verseText: t(400),
});
export const MinistriesSchema = z.object({
  eyebrow: t(60),
  title: t(80),
  accent: t(80),
  lead: t(400),
  sectionLabel: t(60),
  sectionHeading: t(80),
  sectionLead: t(400),
  groups: z.tuple([GroupSchema, GroupSchema, GroupSchema, GroupSchema]),
});
export const DEFAULT_MINISTRIES: z.infer<typeof MinistriesSchema> = {
  eyebrow: 'Our Ministries',
  title: 'Every season of life,',
  accent: 'a place to belong',
  lead: 'Our four ministry groups are shaped around where you are in life — so you always walk with people who truly understand your journey.',
  sectionLabel: 'Our Groups',
  sectionHeading: 'Four groups. One family.',
  sectionLead: 'Every person who walks through our doors belongs to one of these groups — hover a card to preview the scripture, click to explore.',
  groups: [
    {
      slug: 'mens',
      name: "Men's Ministry",
      body: 'A community where men grow in faith, character, and godly leadership — sharpening one another for family, work, and purpose.',
      verseRef: 'Prov 27:17',
      verseText: 'Iron sharpens iron, and one man sharpens another.',
    },
    {
      slug: 'womens',
      name: "Women's Ministry",
      body: "A space where women are celebrated, equipped, and rooted in God's word — building each other up in grace and truth.",
      verseRef: 'Prov 31:25',
      verseText: 'She is clothed with strength and dignity; she can laugh at the days to come.',
    },
    {
      slug: 'teens',
      name: "Teen's Ministry",
      body: 'A movement for the next generation — where teenagers encounter God, own their faith, and discover who He made them to be.',
      verseRef: '1 Tim 4:12',
      verseText: "Don't let anyone look down on you because you are young, but set an example in speech, in conduct, in love, in faith and in purity.",
    },
    {
      slug: 'couples',
      name: "Couple's Ministry",
      body: 'Strengthening marriages through the word, community, and intentional moments that remind couples why they chose each other.',
      verseRef: 'Eccl 4:9',
      verseText: 'Two are better than one, because they have a good return for their labour — for if either of them falls, one can help the other up.',
    },
  ],
};

// ── Ministry detail (one per group: /ministries/mens, /womens, /teens, /couples) ──
const ActivitySchema = z.object({ num: t(4), title: t(80), body: t(600) });
export const MinistryDetailSchema = z.object({
  name: t(60),
  heroLabel: t(60),
  heroHeadline: t(120),
  heroAccent: t(120),
  heroBody: t(600),
  overview: t(1500),
  pullQuote: t(200),
  verseRef: t(60),
  verseText: t(400),
  activities: z.tuple([ActivitySchema, ActivitySchema, ActivitySchema, ActivitySchema]),
  who: t(400),
  close: t(200),
});
type MinistryDetail = z.infer<typeof MinistryDetailSchema>;

export const DEFAULT_MINISTRY_MENS: MinistryDetail = {
  name: "Men's Ministry",
  heroLabel: 'Brotherhood',
  heroHeadline: 'Iron sharpens iron.',
  heroAccent: 'Show up and be sharpened.',
  heroBody:
    'A community of men forged in honesty, accountability, and the word of God. No performance. No pretence. Just brothers walking together.',
  overview:
    "The Men's Ministry exists to build men of God who lead with integrity — in their homes, their work, and their community. We believe men don't grow alone. They grow in rooms where honesty is allowed, where scripture is taken seriously, and where no one has to pretend they have it all together.",
  pullQuote: 'You were never meant to carry it alone.',
  verseRef: 'Proverbs 27:17',
  verseText: 'Iron sharpens iron, and one man sharpens another.',
  activities: [
    { num: '01', title: 'Prayer Breakfast', body: "Every month, before the city wakes up, brothers gather to pray, eat, and speak life over each other. The kind of conversation most men never have — and can't stop having once they do." },
    { num: '02', title: 'Bible Study', body: 'We read scripture the way iron reads iron — honestly, without softening the edges. Real questions. Real answers. Men who actually want to understand what God is saying.' },
    { num: '03', title: 'Mentorship', body: 'Seasoned men pour into younger ones. Not lectures. Just life shared across a table — wisdom that only comes from someone who has walked the road ahead of you.' },
    { num: '04', title: 'Annual Retreat', body: 'One weekend. No distractions. Just you, God, and the men He has placed beside you. Men come in carrying weight. They leave different.' },
  ],
  who: 'Adult men (20 and above) who want to grow in faith, take their calling seriously, and walk with other men doing the same.',
  close: 'Every man needs a circle. This is yours.',
};

export const DEFAULT_MINISTRY_WOMENS: MinistryDetail = {
  name: "Women's Ministry",
  heroLabel: 'Sisterhood',
  heroHeadline: 'Clothed with strength.',
  heroAccent: 'Walk in who you already are.',
  heroBody:
    'A sisterhood where every woman — regardless of where she is in life — finds belonging, truth, and the courage to walk in her God-given identity.',
  overview:
    "The Women's Ministry is a community where women are celebrated, equipped, and deeply rooted in God's word. We gather to build one another up in truth and prayer — through seasons of joy and seasons of hardship — as women who know whose they are.",
  pullQuote: 'You were made for more than survival.',
  verseRef: 'Proverbs 31:25',
  verseText: 'She is clothed with strength and dignity; she can laugh at the days to come.',
  activities: [
    { num: '01', title: "Women's Fellowship", body: 'Regular gatherings centred on worship, the word, and the kind of honest conversation that leaves you feeling truly seen and known.' },
    { num: '02', title: 'Prayer Circles', body: 'Intimate prayer groups that go deep — believing God together for the things that feel too heavy to carry alone.' },
    { num: '03', title: 'Skill Development', body: 'Workshops that equip women in family, career, finances, and personal growth — because God is Lord over all of it.' },
    { num: '04', title: 'Annual Conference', body: 'A highlight of the year. Powerful speakers, worship, and encounters that stay with you long after you go home.' },
  ],
  who: 'All women of the church — single, married, young, or seasoned — who desire to grow in who God made them to be.',
  close: 'You belong here exactly as you are.',
};

export const DEFAULT_MINISTRY_TEENS: MinistryDetail = {
  name: "Teen's Ministry",
  heroLabel: 'The Next Generation',
  heroHeadline: "Don't let anyone look down on you.",
  heroAccent: 'Own your faith. Now.',
  heroBody:
    'A movement for the next generation — where teenagers encounter God, own their faith, and discover who He made them to be.',
  overview:
    "Teen's Ministry is a movement — not just a service. We exist to help teenagers encounter God in a real and personal way, to walk boldly in who He made them, and to build friendships that outlast high school. This generation doesn't need to wait to do something great for God.",
  pullQuote: "Your faith is not a smaller version of someone else's.",
  verseRef: '1 Timothy 4:12',
  verseText:
    "Don't let anyone look down on you because you are young, but set an example in speech, in conduct, in love, in faith and in purity.",
  activities: [
    { num: '01', title: 'Weekly Youth Services', body: "Energetic, Spirit-filled services built for how teens worship. You'll feel it from the moment you walk in." },
    { num: '02', title: 'Teen Bible Study', body: 'Real conversations about faith, identity, purpose, and the world you actually live in — no sanitised answers, no filler.' },
    { num: '03', title: 'Annual Youth Camp', body: "Days away from school and screens, into God's presence, deep conversations, and friendships you'll carry for life." },
    { num: '04', title: 'Community Outreach', body: 'Teens serving beyond church walls — learning early that a life of faith was never meant to stay inside a building.' },
  ],
  who: 'Young people between the ages of 13 and 19 who are ready to own their faith and find their people.',
  close: 'You are not the next generation. You are this generation.',
};

export const DEFAULT_MINISTRY_COUPLES: MinistryDetail = {
  name: "Couple's Ministry",
  heroLabel: 'Marriage',
  heroHeadline: 'Two are better than one.',
  heroAccent: 'A great marriage is built, not found.',
  heroBody:
    'Strengthening marriages through the word, honest conversation, and intentional moments that remind couples why they chose each other.',
  overview:
    "The Couple's Ministry is built on the belief that a strong marriage changes everything — family, community, and church. We gather to strengthen marriages through the word, real conversations, and intentional experiences that help couples grow closer to each other and to God.",
  pullQuote: 'The best version of your marriage is still ahead.',
  verseRef: 'Ecclesiastes 4:9',
  verseText:
    'Two are better than one, because they have a good return for their labour — for if either of them falls, one can help the other up.',
  activities: [
    { num: '01', title: "Monthly Couples' Dinner", body: 'A relaxed evening for married couples to reconnect, share, and build friendships with others who take marriage seriously.' },
    { num: '02', title: 'Marriage Enrichment', body: "Practical, honest teaching on communication, intimacy, finances, and building a home that reflects God's love." },
    { num: '03', title: 'Annual Retreat', body: 'A dedicated weekend to quiet the noise and deepen the bond between you and your spouse.' },
    { num: '04', title: 'Support Groups', body: 'Safe spaces for couples navigating hard seasons — with prayer, pastoral care, and people who understand.' },
  ],
  who: 'Married couples at any stage — newlyweds figuring it out, or long-married partners ready to go deeper.',
  close: 'The best marriages are built together — in community.',
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
