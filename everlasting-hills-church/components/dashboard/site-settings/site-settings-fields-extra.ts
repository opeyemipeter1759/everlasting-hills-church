import type { FieldDef } from "@/components/dashboard/admin/cms/structured/StructuredForm";

/** Shared CTA field group, plus the field lists for the newer homepage sections (kept here so site-settings-fields.ts stays small). */

export const cta = (key: string, label: string): FieldDef => ({
  kind: "group",
  key,
  label,
  fields: [
    { kind: "text", key: "label", label: "Button label" },
    { kind: "text", key: "href", label: "Link (# section or /path)" },
  ],
});

export const directions: FieldDef[] = [
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "text", key: "headlineAccent", label: "Headline accent (highlighted words)" },
  { kind: "textarea", key: "body", label: "Body" },
  { kind: "text", key: "addressLabel", label: "Address tile label", help: "Small eyebrow shown above the address" },
  { kind: "text", key: "email", label: "Email" },
  { kind: "text", key: "ctaLabel", label: "\"Get directions\" button label", help: "The button triggers maps/geolocation directly — no link to set" },
  cta("secondaryCta", "Secondary button"),
];

export const setman: FieldDef[] = [
  { kind: "boolean", key: "visible", label: "Show this section on the homepage" },
  { kind: "text", key: "label", label: "Section label", help: "Small eyebrow above the headline" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "text", key: "headlineAccent", label: "Headline accent (burgundy second line)" },
  { kind: "list", key: "paragraphs", label: "Message", help: "One paragraph per line (up to 5)" },
  { kind: "image", key: "photo", label: "Portrait", help: "Tall portrait works best (4:5). Leave empty to show the church monogram.", nullable: true },
  { kind: "text", key: "name", label: "Name", help: "e.g. Pastor John Doe" },
  { kind: "text", key: "title", label: "Title / role", help: "Shown under the name" },
  cta("cta", "Button"),
];
