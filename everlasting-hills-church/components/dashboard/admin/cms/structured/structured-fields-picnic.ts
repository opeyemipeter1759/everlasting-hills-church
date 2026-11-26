import type { FieldDef } from "./StructuredForm";

/** One photo spot: the picture, a description for screen readers, and (where the design has one) its caption. */
const photo = (key: string, label: string, help: string, caption = false): FieldDef => ({
  kind: "group",
  key,
  label,
  fields: [
    { kind: "image", key: "src", label: "Picture", nullable: true, help: `${help} Leave blank for the page's own photo.` },
    { kind: "text", key: "alt", label: "What the picture shows", nullable: true, help: "For people using screen readers, e.g. \"Families sharing food on the grass\"." },
    ...(caption ? [{ kind: "text", key: "caption", label: "Handwritten caption", nullable: true, help: "Leave blank to show no caption." } as FieldDef] : []),
  ],
});

/**
 * Photos sit beside the words they go with. Every group shares the `photos`
 * object; each edits only its own spots and keeps the rest.
 */
const photos = (label: string, spots: FieldDef[]): FieldDef => ({ kind: "group", key: "photos", label, fields: spots });

/** /picnic: words, date, time, venue, games and every photo. The layout stays as designed. */
export const picnicFields: FieldDef[] = [
  { kind: "text", key: "kicker", label: "Line above the headline" },
  { kind: "text", key: "headline", label: "Headline, first line" },
  { kind: "text", key: "headlineMiddle", label: "Headline, second line" },
  { kind: "text", key: "headlineAccent", label: "Headline, last line (in red)" },
  { kind: "textarea", key: "intro", label: "Intro paragraph" },
  { kind: "text", key: "date", label: "Picnic date", nullable: true, inputType: "date", help: 'Leave blank to show "Date to be announced". The gift exchange happens on this day.' },
  { kind: "text", key: "time", label: "Time", nullable: true, help: 'e.g. "From 2:00 PM". Leave blank until it is confirmed.' },
  { kind: "text", key: "venue", label: "Venue", nullable: true, help: 'Leave blank to show "Venue to be announced".' },
  photos("Top of the page: photos", [
    photo("hero", "Large photo", "Tall photos work best (4:5). Also used on the share-to-status card and link previews.", true),
    photo("heroSmall", "Small square photo", "Square photos work best."),
  ]),
  { kind: "list", key: "vibes", label: "Hangout strip", help: "The words drifting along the green band under the top of the page. One per line, up to 16. Leave empty to hide the strip." },
  { kind: "text", key: "afternoonKicker", label: "Afternoon section label" },
  { kind: "text", key: "afternoonTitle", label: "Afternoon section heading" },
  { kind: "text", key: "familyNote", label: "Note on the family photo" },
  photos("Afternoon section: photo", [photo("family", "Family photo", "Wide photos work best (5:4).")]),
  {
    kind: "repeat",
    key: "afternoon",
    label: "What happens on the day",
    itemLabel: "Item",
    max: 6,
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Description" },
    ],
  },
  { kind: "textarea", key: "verseText", label: "Scripture over the photo" },
  { kind: "text", key: "verseRef", label: "Scripture reference" },
  photos("Scripture section: background photo", [
    photo("verse", "Background photo", "A wide, high-quality landscape photo; the scripture sits over its lower half. Also used on the dashboard's picnic banners."),
  ]),
  { kind: "text", key: "gamesKicker", label: "Games section label" },
  { kind: "text", key: "gamesTitle", label: "Games section heading" },
  { kind: "textarea", key: "gamesIntro", label: "Games section intro" },
  {
    kind: "repeat",
    key: "games",
    label: "Games",
    itemLabel: "Game",
    max: 60,
    fields: [
      { kind: "text", key: "name", label: "Game" },
      { kind: "textarea", key: "description", label: "What happens" },
      { kind: "image", key: "image", label: "Photo", nullable: true, help: "Leave blank for a plain gingham panel" },
      { kind: "text", key: "forWho", label: "Who it's for", nullable: true, help: 'e.g. "Children", "Everyone". Leave blank to hide.' },
    ],
  },
  { kind: "list", key: "bring", label: "Bring along", help: "One item per line, up to eight" },
  { kind: "text", key: "bringClose", label: "Closing line under the list" },
  photos("Bring-along section: the three prints", [
    photo("bring1", "Tall print (left)", "Tall photos work best (3:4).", true),
    photo("bring2", "Top print (right)", "Tall photos work best (3:4). Also the picnic choice in the members' sign-up.", true),
    photo("bring3", "Square print (right)", "Square photos work best.", true),
  ]),
  { kind: "text", key: "rsvpTitle", label: "Registration heading" },
  { kind: "textarea", key: "rsvpBody", label: "Registration text" },
];
