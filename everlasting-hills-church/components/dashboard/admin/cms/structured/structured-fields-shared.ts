import type { FieldDef } from "./StructuredForm";

export const hero: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "title", label: "Title" },
  { kind: "text", key: "accent", label: "Accent (highlighted words)" },
  { kind: "textarea", key: "lead", label: "Lead paragraph" },
];

export const heroImageField: FieldDef = {
  kind: "image",
  key: "heroImage",
  label: "Hero background image",
  nullable: true,
  help: "Leave blank for the default dark background",
};

export const cta: FieldDef = {
  kind: "group",
  key: "cta",
  label: "Closing section",
  fields: [
    { kind: "text", key: "heading", label: "Heading" },
    { kind: "textarea", key: "body", label: "Body" },
  ],
};
