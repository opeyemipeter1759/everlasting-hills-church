import type { FieldDef } from "@/components/dashboard/admin/cms/structured/StructuredForm";
import type { SiteSectionName } from "@/lib/site-settings";

/**
 * Field definitions for each homepage section, mirroring lib/site-settings.ts's
 * SiteSettingsMap shapes. Same pattern as structured-fields.ts for CMS pages —
 * a section's editor is a field list, not a bespoke form component.
 */

const cta = (key: string, label: string): FieldDef => ({
  kind: "group",
  key,
  label,
  fields: [
    { kind: "text", key: "label", label: "Button label" },
    { kind: "text", key: "href", label: "Link (# section or /path)" },
  ],
});

const DAY_OPTIONS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
];

const hero: FieldDef[] = [
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "text", key: "headlineAccent", label: "Headline accent (highlighted words)" },
  { kind: "textarea", key: "subtext", label: "Subtext" },
  {
    kind: "group",
    key: "scriptureBadge",
    label: "Scripture badge",
    fields: [
      { kind: "boolean", key: "visible", label: "Show badge" },
      { kind: "text", key: "text", label: "Badge text" },
    ],
  },
  cta("ctaPrimary", "Primary button"),
  cta("ctaSecondary", "Secondary button"),
  { kind: "imageList", key: "carouselImages", label: "Carousel images", help: "Shown in the homepage hero's photo strip", max: 12 },
  {
    kind: "group",
    key: "mediaCard",
    label: "Media card",
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "text", key: "subtitle", label: "Subtitle" },
    ],
  },
];

const about: FieldDef[] = [
  { kind: "text", key: "label", label: "Section label" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "text", key: "headlineAccent", label: "Headline accent" },
  { kind: "list", key: "paragraphs", label: "Paragraphs", help: "One paragraph per line" },
  {
    kind: "repeat",
    key: "gallery",
    label: "Gallery",
    itemLabel: "Image",
    fields: [
      { kind: "image", key: "src", label: "Image" },
      { kind: "text", key: "name", label: "Caption" },
    ],
  },
  cta("ctaPrimary", "Primary button"),
  cta("ctaSecondary", "Secondary button"),
];

const culture: FieldDef[] = [
  { kind: "text", key: "label", label: "Section label" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "text", key: "subtext", label: "Subtext" },
  {
    kind: "repeat",
    key: "cards",
    label: "Cards (three)",
    itemLabel: "Card",
    fixed: true,
    fields: [
      { kind: "text", key: "headline", label: "Headline" },
      { kind: "textarea", key: "body", label: "Body" },
      { kind: "text", key: "verseRef", label: "Verse reference" },
      { kind: "textarea", key: "verseText", label: "Verse text" },
    ],
  },
];

const scripture: FieldDef[] = [
  { kind: "text", key: "label", label: "Section label" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "text", key: "subtext", label: "Subtext" },
  {
    kind: "repeat",
    key: "pillars",
    label: "Pillars (four)",
    itemLabel: "Pillar",
    fixed: true,
    fields: [
      { kind: "text", key: "phrase", label: "Phrase" },
      { kind: "textarea", key: "detail", label: "Detail" },
    ],
  },
  {
    kind: "group",
    key: "bottomQuote",
    label: "Bottom quote",
    fields: [
      { kind: "textarea", key: "text", label: "Quote text" },
      { kind: "text", key: "reference", label: "Reference" },
    ],
  },
];

const service: FieldDef[] = [
  { kind: "text", key: "heroLabel", label: "Hero eyebrow label", nullable: true, help: "Leave blank to use the default" },
  { kind: "textarea", key: "heroIntro", label: "Hero intro paragraph", nullable: true, help: "Leave blank to use the default" },
  { kind: "text", key: "firstTimerTitle", label: "First-timer callout title", nullable: true, help: "Leave blank to use the default" },
  { kind: "textarea", key: "firstTimerBody", label: "First-timer callout body", nullable: true, help: "Leave blank to use the default" },
  {
    kind: "repeat",
    key: "services",
    label: "Services",
    itemLabel: "Service",
    fields: [
      { kind: "text", key: "label", label: "Name" },
      { kind: "select", key: "day", label: "Day", options: DAY_OPTIONS },
      { kind: "text", key: "startTime", label: "Start time (HH:MM)" },
      { kind: "text", key: "endTime", label: "End time (HH:MM)" },
      { kind: "text", key: "liveStartTime", label: "Live/check-in opens (HH:MM)" },
      { kind: "textarea", key: "description", label: "Description" },
    ],
  },
  { kind: "text", key: "locationName", label: "Location name" },
  { kind: "text", key: "address", label: "Address", nullable: true },
  { kind: "text", key: "mapsLink", label: "Maps link", nullable: true },
  { kind: "textarea", key: "specialAnnouncement", label: "Special announcement", nullable: true, help: "Leave blank to hide" },
];

const sermons: FieldDef[] = [
  { kind: "text", key: "label", label: "Section label" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "textarea", key: "subtext", label: "Subtext" },
  cta("viewAllCta", "“View all” button"),
  { kind: "number", key: "displayCount", label: "Sermons to display" },
];

const community: FieldDef[] = [
  { kind: "text", key: "label", label: "Section label" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "list", key: "paragraphs", label: "Paragraphs", help: "One paragraph per line" },
  cta("ctaPrimary", "Primary button"),
  cta("ctaSecondary", "Secondary button"),
  {
    kind: "group",
    key: "visualCard",
    label: "Visual card",
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "headline", label: "Headline" },
      { kind: "textarea", key: "tagline", label: "Tagline" },
    ],
  },
  {
    kind: "group",
    key: "statCard",
    label: "Stat card",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "text", key: "subtitle", label: "Subtitle" },
    ],
  },
];

const giving: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "text", key: "headlineAccent", label: "Headline accent" },
  { kind: "textarea", key: "body", label: "Body" },
  {
    kind: "repeat",
    key: "impactTiles",
    label: "Impact tiles (three)",
    itemLabel: "Tile",
    fixed: true,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "copy", label: "Copy" },
    ],
  },
  {
    kind: "repeat",
    key: "waysToGive",
    label: "Ways to give",
    itemLabel: "Way",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "description", label: "Description" },
    ],
  },
  {
    kind: "group",
    key: "badge",
    label: "Badge",
    fields: [
      { kind: "boolean", key: "visible", label: "Show badge" },
      { kind: "text", key: "text", label: "Badge text" },
    ],
  },
  cta("cta", "Button"),
  { kind: "textarea", key: "footnote", label: "Footnote", nullable: true, help: "Leave blank to hide" },
];

const socialGroup = (key: string, label: string, fields: FieldDef[]): FieldDef => ({
  kind: "group",
  key,
  label,
  fields: [{ kind: "boolean", key: "visible", label: "Show on site" }, ...fields],
});

const contact: FieldDef[] = [
  socialGroup("whatsapp", "WhatsApp", [
    { kind: "text", key: "label", label: "Label" },
    { kind: "text", key: "url", label: "URL" },
  ]),
  socialGroup("instagram", "Instagram", [
    { kind: "text", key: "handle", label: "Handle" },
    { kind: "text", key: "url", label: "URL" },
  ]),
  socialGroup("email", "Email", [
    { kind: "text", key: "address", label: "Address" },
  ]),
  socialGroup("youtube", "YouTube", [
    { kind: "text", key: "url", label: "URL", nullable: true },
  ]),
  socialGroup("facebook", "Facebook", [
    { kind: "text", key: "url", label: "URL", nullable: true },
  ]),
  socialGroup("twitter", "Twitter / X", [
    { kind: "text", key: "url", label: "URL", nullable: true },
  ]),
  socialGroup("tiktok", "TikTok", [
    { kind: "text", key: "url", label: "URL", nullable: true },
  ]),
];

const carousel: FieldDef[] = [
  { kind: "text", key: "eyebrow", label: "Eyebrow" },
  { kind: "text", key: "headline", label: "Headline" },
  { kind: "imageList", key: "images", label: "Slides", help: "\"Life at EHC\" editorial slider on the homepage", max: 30 },
];

export const SITE_SETTINGS_FIELDS: Record<SiteSectionName, FieldDef[]> = {
  HERO: hero,
  ABOUT: about,
  CULTURE: culture,
  SCRIPTURE: scripture,
  SERVICE: service,
  SERMONS: sermons,
  COMMUNITY: community,
  GIVING: giving,
  CONTACT: contact,
  CAROUSEL: carousel,
};
