import type { FieldDef } from "./StructuredForm";

/** /picnic: the words, time and venue. The photographs and layout stay as designed. */
export const picnicFields: FieldDef[] = [
  { kind: "text", key: "kicker", label: "Line above the headline" },
  { kind: "text", key: "headline", label: "Headline, first line" },
  { kind: "text", key: "headlineMiddle", label: "Headline, second line" },
  { kind: "text", key: "headlineAccent", label: "Headline, last line (in red)" },
  { kind: "textarea", key: "intro", label: "Intro paragraph" },
  { kind: "text", key: "date", label: "Picnic date", nullable: true, inputType: "date", help: 'Leave blank to show "Date to be announced". The gift exchange happens on this day.' },
  { kind: "text", key: "time", label: "Time", nullable: true, help: 'e.g. "From 2:00 PM". Leave blank until it is confirmed.' },
  { kind: "text", key: "venue", label: "Venue", nullable: true, help: 'Leave blank to show "Venue to be announced".' },
  { kind: "text", key: "afternoonKicker", label: "Afternoon section label" },
  { kind: "text", key: "afternoonTitle", label: "Afternoon section heading" },
  { kind: "text", key: "familyNote", label: "Note on the family photo" },
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
      { kind: "text", key: "forWho", label: "Who it's for", nullable: true, help: 'e.g. "Children", "Everyone". Leave blank to hide.' },
    ],
  },
  { kind: "list", key: "bring", label: "Bring along", help: "One item per line, up to eight" },
  { kind: "text", key: "bringClose", label: "Closing line under the list" },
  { kind: "text", key: "rsvpTitle", label: "Registration heading" },
  { kind: "textarea", key: "rsvpBody", label: "Registration text" },
];
