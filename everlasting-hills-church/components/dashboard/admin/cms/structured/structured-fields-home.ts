import type { FieldDef } from "./StructuredForm";

export const homeFields: FieldDef[] = [
  {
    kind: "group",
    key: "setman",
    label: "A Word From Our Set Man",
    fields: [
      { kind: "boolean", key: "visible", label: "Show this section on the homepage" },
      { kind: "text", key: "label", label: "Section label" },
      { kind: "text", key: "headline", label: "Headline" },
      { kind: "text", key: "headlineAccent", label: "Headline accent" },
      { kind: "list", key: "paragraphs", label: "Message", help: "One paragraph per line (up to 5)" },
      { kind: "image", key: "photo", label: "Portrait", nullable: true, help: "Tall portrait works best (4:5)" },
      { kind: "text", key: "name", label: "Name" },
      { kind: "text", key: "title", label: "Title / role" },
      {
        kind: "group",
        key: "cta",
        label: "Button",
        fields: [
          { kind: "text", key: "label", label: "Button label" },
          { kind: "text", key: "href", label: "Link" },
        ],
      },
    ],
  },
];
