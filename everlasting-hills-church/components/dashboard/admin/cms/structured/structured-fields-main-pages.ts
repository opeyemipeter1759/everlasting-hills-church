import type { FieldDef } from "./StructuredForm";
import { cta, hero, heroImageField } from "./structured-fields-shared";

export const MAIN_PAGE_FIELDS: Record<string, FieldDef[]> = {
  beliefs: [
    ...hero,
    heroImageField,
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
    { kind: "image", key: "heroImage", label: "Hero background image", nullable: true, help: "Leave blank for the default dark background" },
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
    heroImageField,
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
};
