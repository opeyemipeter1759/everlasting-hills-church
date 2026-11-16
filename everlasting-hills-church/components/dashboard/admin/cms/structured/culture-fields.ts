import type { FieldDef } from "./StructuredForm";

/** Editor fields for "Our Culture" (/cultures). Mirrors CulturesSchema in the backend. */
export const cultureFields: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "title", label: "Title" },
  { kind: "text", key: "accent", label: "Accent (highlighted words)" },
  { kind: "textarea", key: "lead", label: "Lead paragraph" },
  { kind: "image", key: "heroImage", label: "Hero background image", nullable: true, help: "Leave blank for the default dark background" },
  {
    kind: "repeat",
    key: "pillars",
    label: "Cultures",
    itemLabel: "Culture",
    max: 24,
    fields: [
      { kind: "text", key: "title", label: "Name", help: "e.g. Prayer" },
      { kind: "text", key: "anchorText", label: "Scripture reference", help: "e.g. Luke 18:1" },
      { kind: "textarea", key: "verseText", label: "Verse (NKJV)" },
      { kind: "text", key: "keyTerm", label: "Original-language word (optional)", nullable: true, help: "e.g. proskartereo" },
      { kind: "text", key: "keyTermMeaning", label: "What the word means (optional)", nullable: true, help: "e.g. to continue steadfastly" },
    ],
  },
  {
    kind: "group",
    key: "cta",
    label: "Closing section",
    fields: [
      { kind: "text", key: "heading", label: "Heading" },
      { kind: "textarea", key: "body", label: "Body" },
    ],
  },
];
