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
    {
      kind: "repeat",
      key: "ministries",
      label: "Ministry units",
      itemLabel: "Unit",
      fields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "textarea", key: "body", label: "Description" },
      ],
    },
    cta,
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
};

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
