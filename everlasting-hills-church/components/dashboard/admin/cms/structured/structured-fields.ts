import type { FieldDef } from "./StructuredForm";

/**
 * Field definitions per structured content type. Adding a designed page = a new
 * entry here (+ a backend Zod schema/seed + public wiring), no bespoke editor UI.
 */

const hero: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "title", label: "Title" },
  { kind: "text", key: "accent", label: "Accent (highlighted words)" },
  { kind: "textarea", key: "lead", label: "Lead paragraph" },
];

const cta: FieldDef = {
  kind: "group",
  key: "cta",
  label: "Closing section",
  fields: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "body", label: "Body" },
  ],
};

export const STRUCTURED_FIELDS: Record<string, FieldDef[]> = {
  beliefs: [
    ...hero,
    {
      kind: "repeat",
      key: "pillars",
      label: "Pillars (five)",
      itemLabel: "Pillar",
      fixed: true,
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "text", key: "verse", label: "Verse reference" },
        { kind: "textarea", key: "text", label: "Text" },
      ],
    },
    cta,
  ],

  about: [
    ...hero,
    {
      kind: "group",
      key: "story",
      label: "Our story",
      fields: [
        { kind: "text", key: "heading", label: "Heading" },
        { kind: "list", key: "paragraphs", label: "Paragraphs", help: "One paragraph per line" },
      ],
    },
    {
      kind: "repeat",
      key: "cards",
      label: "Vision / Mission / Heart (three)",
      itemLabel: "Card",
      fixed: true,
      fields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "body", label: "Body" },
      ],
    },
    cta,
  ],

  ministries: [
    ...hero,
    { kind: "text", key: "sectionLabel", label: "Groups section label" },
    { kind: "text", key: "sectionHeading", label: "Groups section heading" },
    { kind: "textarea", key: "sectionLead", label: "Groups section intro" },
    {
      kind: "repeat",
      key: "groups",
      label: "Ministry groups (four)",
      itemLabel: "Group",
      fixed: true,
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "textarea", key: "body", label: "Card description" },
        { kind: "text", key: "verseRef", label: "Verse reference" },
        { kind: "textarea", key: "verseText", label: "Verse text (card back)" },
      ],
    },
  ],

  visit: [
    ...hero,
    { kind: "text", key: "serviceTimesHeading", label: "Service times heading" },
    {
      kind: "repeat",
      key: "serviceTimes",
      label: "Service times",
      itemLabel: "Service",
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "day", label: "Day" },
        { kind: "text", key: "time", label: "Time" },
      ],
    },
    { kind: "text", key: "locationHeading", label: "Location heading" },
    { kind: "text", key: "address", label: "Address" },
    {
      kind: "group",
      key: "expect",
      label: "What to expect",
      fields: [
        { kind: "text", key: "label", label: "Section label" },
        { kind: "text", key: "heading", label: "Heading" },
      ],
    },
    {
      kind: "repeat",
      key: "expectItems",
      label: "What to expect — cards",
      itemLabel: "Card",
      fields: [
        { kind: "text", key: "title", label: "Question / title" },
        { kind: "textarea", key: "body", label: "Answer" },
      ],
    },
    cta,
  ],

  give: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "titleTop", label: "Headline line 1" },
    { kind: "text", key: "accentTop", label: "Headline line 1 — accent word" },
    { kind: "text", key: "titleBottom", label: "Headline line 2" },
    { kind: "text", key: "accentBottom", label: "Headline line 2 — accent word" },
    { kind: "textarea", key: "subtitle", label: "Subtitle" },
    { kind: "text", key: "sectionLabel", label: "Accounts section label" },
    { kind: "text", key: "headingLead", label: "Accounts heading" },
    { kind: "text", key: "headingAccent", label: "Accounts heading — accent" },
    { kind: "text", key: "accountName", label: "Account name (shared by all accounts)" },
    {
      kind: "repeat",
      key: "local",
      label: "Local (Naira) accounts",
      itemLabel: "Account",
      fields: [
        { kind: "text", key: "bank", label: "Bank" },
        { kind: "text", key: "purpose", label: "Purpose" },
        { kind: "text", key: "number", label: "Account number" },
        { kind: "text", key: "currency", label: "Currency" },
      ],
    },
    {
      kind: "repeat",
      key: "domiciliary",
      label: "Domiciliary accounts",
      itemLabel: "Account",
      fields: [
        { kind: "text", key: "bank", label: "Bank" },
        { kind: "text", key: "purpose", label: "Purpose" },
        { kind: "text", key: "number", label: "Account number" },
        { kind: "text", key: "currency", label: "Currency" },
      ],
    },
  ],

  contact: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "accent", label: "Accent (highlighted words)" },
    { kind: "textarea", key: "subtitle", label: "Subtitle" },
  ],
};

// Ministry detail pages (/ministries/mens, /womens, /teens, /couples) — same
// bespoke layout, one shared field set; icon + hero image stay fixed per group.
const ministryDetailFields: FieldDef[] = [
  { kind: "text", key: "name", label: "Ministry name" },
  { kind: "text", key: "heroLabel", label: "Hero eyebrow" },
  { kind: "text", key: "heroHeadline", label: "Hero headline" },
  { kind: "text", key: "heroAccent", label: "Hero accent line" },
  { kind: "textarea", key: "heroBody", label: "Hero body" },
  { kind: "textarea", key: "overview", label: 'Overview ("Who we are")' },
  { kind: "text", key: "pullQuote", label: "Pull quote" },
  { kind: "text", key: "verseRef", label: "Verse reference" },
  { kind: "textarea", key: "verseText", label: "Verse text" },
  {
    kind: "repeat",
    key: "activities",
    label: "Activities (four)",
    itemLabel: "Activity",
    fixed: true,
    fields: [
      { kind: "text", key: "num", label: "Number (e.g. 01)" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Description" },
    ],
  },
  { kind: "textarea", key: "who", label: "Who it's for" },
  { kind: "text", key: "close", label: "Closing statement" },
];
STRUCTURED_FIELDS.ministryMens = ministryDetailFields;
STRUCTURED_FIELDS.ministryWomens = ministryDetailFields;
STRUCTURED_FIELDS.ministryTeens = ministryDetailFields;
STRUCTURED_FIELDS.ministryCouples = ministryDetailFields;

// Intro copy over module-driven pages (sermons, events)
const introFields: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "title", label: "Title" },
  { kind: "textarea", key: "subtitle", label: "Subtitle" },
];
STRUCTURED_FIELDS.sermonsIntro = introFields;
STRUCTURED_FIELDS.eventsIntro = introFields;

// Legal / policy pages
const legalFields: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "title", label: "Title" },
  { kind: "text", key: "accent", label: "Accent" },
  { kind: "text", key: "updated", label: "Last updated" },
  { kind: "textarea", key: "intro", label: "Intro" },
  {
    kind: "repeat",
    key: "sections",
    label: "Sections",
    itemLabel: "Section",
    fields: [
      { kind: "text", key: "heading", label: "Heading" },
      { kind: "textarea", key: "body", label: "Body", help: "Blank line between paragraphs; start a line with '- ' for a bullet" },
    ],
  },
];
STRUCTURED_FIELDS.privacyLegal = legalFields;
STRUCTURED_FIELDS.termsLegal = legalFields;

export function structuredFields(contentType: string): FieldDef[] | undefined {
  return STRUCTURED_FIELDS[contentType];
}
