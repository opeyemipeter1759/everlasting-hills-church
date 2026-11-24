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
