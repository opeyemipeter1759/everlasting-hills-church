import type { FieldDef } from "./StructuredForm";
import { cta, hero, heroImageField } from "./structured-fields-shared";

export const VISIT_GIVE_FIELDS: Record<string, FieldDef[]> = {
  visit: [
    ...hero,
    heroImageField,
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
    heroImageField,
    { kind: "text", key: "sectionLabel", label: "Accounts section label" },
    { kind: "text", key: "headingLead", label: "Accounts heading" },
    { kind: "text", key: "headingAccent", label: "Accounts heading — accent" },
    { kind: "text", key: "accountName", label: "Account name (shared by all accounts)" },
    ...["local", "domiciliary"].map((key) => ({
      kind: "repeat" as const,
      key,
      label: key === "local" ? "Local (Naira) accounts" : "Domiciliary accounts",
      itemLabel: "Account",
      fields: [
        { kind: "text" as const, key: "bank", label: "Bank" },
        { kind: "text" as const, key: "purpose", label: "Purpose" },
        { kind: "text" as const, key: "number", label: "Account number" },
        { kind: "text" as const, key: "currency", label: "Currency" },
      ],
    })),
  ],
  contact: [
    { kind: "text", key: "eyebrow", label: "Eyebrow" },
    { kind: "text", key: "title", label: "Title" },
    { kind: "text", key: "accent", label: "Accent (highlighted words)" },
    { kind: "textarea", key: "subtitle", label: "Subtitle" },
  ],
};
