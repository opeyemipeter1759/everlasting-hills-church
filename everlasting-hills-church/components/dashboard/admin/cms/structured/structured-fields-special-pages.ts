import type { FieldDef } from "./StructuredForm";
import { cultureFields } from "./culture-fields";
import { heroImageField } from "./structured-fields-shared";

const ministryDetailFields: FieldDef[] = [
  { kind: "text", key: "name", label: "Ministry name" },
  { kind: "text", key: "heroLabel", label: "Hero eyebrow" },
  { kind: "text", key: "heroHeadline", label: "Hero headline" },
  { kind: "text", key: "heroAccent", label: "Hero accent line" },
  { kind: "textarea", key: "heroBody", label: "Hero body" },
  { kind: "image", key: "heroImage", label: "Hero background image", nullable: true, help: "Leave blank to use this group's default photo" },
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

const introFields: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "title", label: "Title" },
  { kind: "textarea", key: "subtitle", label: "Subtitle" },
];

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

export const SPECIAL_PAGE_FIELDS: Record<string, FieldDef[]> = {
  ministryMens: ministryDetailFields,
  ministryWomens: ministryDetailFields,
  ministryTeens: ministryDetailFields,
  ministryCouples: ministryDetailFields,
  sermonsIntro: introFields,
  eventsIntro: [...introFields, heroImageField],
  privacyLegal: legalFields,
  termsLegal: legalFields,
  cultures: cultureFields,
};
