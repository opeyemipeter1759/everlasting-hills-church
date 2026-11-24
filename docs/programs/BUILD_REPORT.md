# Programs: build report

## Open questions (built with the seeded defaults; each can be fixed in the dashboard)

1. **Endyo:** cadence, day and time. Seeded as Custom, date to be announced.
2. **Homecoming conference:**
   - name: seeded as "Homecoming Conference", marked provisional;
   - date: seeded as the last weekend of April (Friday to Sunday), date to be announced;
   - scripture: none.
3. **Dew of Heaven:** do the sessions on the first and second days have fixed times? Seeded as 10 PM on the last day of the month, for 48 hours.
4. **Prayer Watch:** does it run on public holidays and through Furnace? Seeded as running every Monday, Tuesday, Thursday, Friday and Saturday regardless.
5. **Prayer Watch and Furnace format:** seeded as hybrid. The brief did not say whether members watch from home or gather.

## Decisions taken without asking

- **Branching.** The prompt asks for `feat/programs` and a PR into `main`. The user told me mid-task to use one branch for everything and to push everything. On top of that, `master` (there is no `main`) now refuses direct pushes, and auto mode blocked pushes to `develop` and to a new branch. So the work is committed per phase on one local branch, `claude/work`, and is waiting for the user to allow a push.
- **Paths and names.**
  - The backend is `ehc-backend/`, not `backend/`.
  - The tenant column is `tenantId`, not `church_id`.
  - Tables are PascalCase with camelCase columns, as in the rest of the schema.
- **Migrations.**
  - `ehc-backend/prisma/MIGRATIONS.md` makes Prisma Migrate the schema history. So the DDL is a Prisma migration (`20261124130000_programs`), applied with `prisma migrate deploy`.
  - It is mirrored as `ehc-backend/prisma/sql/programs/001_programs.sql`, with a down file, as the prompt asks.
  - A side-channel `prisma db execute` would have left the history out of step.
- **Module.** I chose option (a), a separate module; see `DESIGN.md` section 3.
- **RLS.** RLS is on for every table, and `anon` and `authenticated` may read published rows only. Tenant isolation is enforced in the service layer. The API uses the service role, as every other module here does, and Postgres has no tenant claim to check.
- **Storage.** Images go through the existing R2 upload endpoint, not Supabase Storage. This repo stores images in R2.
- **CLAUDE.md.** There is no `CLAUDE.md` in the repo. I followed the house rules in the prompt and in my notes on this project.

## Copy I wrote (please review)

All five long descriptions, and Homecoming's short description, were drafted by me from the brief. They are in `ehc-backend/src/programs/programs.seed.ts` and editable in the dashboard.

## Phase 1: schema, RLS, seed

Built:
- the `Program`, `ProgramScripture`, `ProgramSession` and `ProgramEdition` tables;
- 8 enums;
- checks on slug, times and duration;
- RLS and the published-only read policy;
- the insert-only seed and its script (`scripts/seed-programs.ts`).

Tests (`programs.schema.db.spec.ts`, against Postgres), 5 of 5 passing:
- the seed is complete;
- re-running it duplicates nothing and never undoes an edit;
- the same slug can exist once per tenant;
- the database refuses a malformed slug, time or duration;
- `anon` sees published programs and their parts only.

Production:
- I printed the target first: the production Supabase project.
- The migration is purely additive, so I applied it with `prisma migrate deploy`.
- I seeded the five programs for the church's tenant.
- Book ids 1, 5, 23, 39 and 42 check out against production's `BibleBook` table, and WEB (the default translation) has the verses.

## Phase 2: recurrence and occurrence service

Built `ehc-backend/src/programs/program-occurrences.ts`. These are pure functions:
- `occurrencesFor` gives the current and next occurrences;
- `sessionWindows` gives each watch as real instants;
- `describeSchedule` gives the schedule in words;
- `eyebrowFor` gives the line above the name.

How it works:
- rrule walks local calendar dates, anchored on a fixed date. Each date becomes an instant through the Gatherings helper `buildGatheringOccurrenceStart`, which handles the timezone offset.
- `startOffsetDays` places the Homecoming weekend (Friday to Sunday around the last Saturday of April).
- Editions override the rule.
- A program that is "to be announced" has no occurrences.

Tests (`program-occurrences.spec.ts`), 14 of 14 passing:
- the Prayer Watch rule, with no Wednesday;
- the overnight watch live at 1 AM Tuesday, in The Watch-House;
- 22:59, 23:00, 23:30 and 23:59 UTC;
- the last UTC hour of a Wednesday, which is already Thursday in Lagos;
- Dew of Heaven: last day of the month, 48 hours;
- Homecoming: the last weekend of April 2027, Friday 23 April;
- programs to be announced;
- the Furnace editions overriding the rule;
- the schedule in words for every preset.

Decision: I fixed Dew of Heaven at 10 PM on the last day for 48 hours (open question 3).

## Phase 3: public API and ICS

Built:
- `GET /public/programs`: published only, this church only. Each card has its schedule in words, its eyebrow, `nextOccurrence`, `isLiveNow`, `liveSession`, occurrence and session windows as instants, and resolved scripture text.
- `GET /public/programs/:slug`: adds the story, venue, stream, watches, and editions split into upcoming and archive.
- `GET /public/programs/:slug/calendar.ics`: the rule itself when it maps one to one, else each dated occurrence. It answers 404 while the dates are to be announced.

How it works:
- Scripture references are parsed against `BibleBook`, and the text is read from `BibleVerse` (default translation, labelled) in one query.
- Lists cache for 60 seconds, because the live state changes by the hour.

Tests, 28 of 28 passing across the module (`program-scripture.spec.ts` and `programs-public.http.db.spec.ts`):
- order;
- drafts and other churches hidden (404 too);
- the card fields;
- The Watch-House live at 1 AM on a Tuesday;
- Furnace '26 in the archive and '27 upcoming;
- the calendar file, with the Lagos TZID and the rule, and 404 while to be announced.

## Phase 4: admin API

The admin API is `/programs`, behind `@Roles(Role.ADMIN)`. Roles come from assignment rows (`effectiveRoles`), and the hierarchy lets Admin, Admin Head, Pastor and Super Admin through.

Routes:
- list, get, create (saved as a draft), update;
- publish, unpublish, archive, delete (a published program must be unpublished or archived first);
- `PATCH /programs/order`;
- replace scriptures, sessions and editions;
- `POST /programs/schedule-preview`;
- `GET /programs/bible-books` and `GET /programs/scripture-check` for the picker.

Rules:
- The update schema is the create fields with no defaults, made optional. A PATCH that leaves a field out cannot reset it, and a test proves it.
- Long descriptions are cleaned on the server against an allowlist.
- Stream, logo, cover and recording links must be https. The CTA may also be a path on this site.
- Only rules the schedule presets produce are accepted.
- Every write calls the existing revalidation hook with the tag `programs:<tenantId>` and the path `/programs`.
- Publish, unpublish, archive and delete each write an `AuditLog` row.
- The page-access map gains `/dashboard/programs`, so a page permission opens the API calls the page makes.
- The OpenAPI contract and the frontend's generated types are regenerated.

Tests (`programs-admin.http.db.spec.ts`, with the real RolesGuard), 13 of 13 passing:
- the six roles: Super Admin, Pastor and Admin get in; Unit Lead, Member and Visitor get 403;
- the list is ordered, scoped to this church, with attention flags;
- a PATCH leaves every omitted field alone;
- HTML is cleaned, http links are refused, and a duplicate slug gets 409;
- each status change leaves an audit row and triggers revalidation;
- reorder refuses another church's id;
- scriptures are checked against the Bible, and sessions and editions are replaced;
- the schedule preview, including the to-be-announced case.

The whole module is now at 41 of 41.

## Phase 5: public UI

I invoked the frontend-design skill before the first component.

The plan:
- The boldness goes into typographic covers. Without a logo, each card's cover is the program's name in DM Serif Display, over a glow in its brand accent (burgundy, gold, crimson or deep burgundy).
- No stock imagery, so the cards add almost nothing to download on 4G.
- Everything else stays quiet: white frosted cards on black, left aligned, one staggered entrance, and the live pulse as the only ongoing motion.
- The brief's fixed points are honoured: the small-caps cadence eyebrow, the palette, the two typefaces and the motion ease.

`/programs`:
- A hero ("Our appointed times"), with Genesis 49:26 as a quiet anchor.
- "The rhythm of the house": live programs first, then the soonest, then those still to be announced. It is recomputed every minute from the server's windows.
- Groups for Weekly, Monthly, Annual and Special, each as a row with its heading beside the cards.
- A loading skeleton shaped like the cards, an empty state and an error state.

`/programs/[slug]`:
- The hero cover is the page heading, with the call to action, a stream link and Add to calendar.
- The scripture block is the emotional centre: full verse text with the translation named, stepping down a size for long passages.
- The schedule in words, the next three dates in WAT, and the calendar file.
- The watches, with the one on now marked.
- Editions, with Furnace '26 (Dominion) in the archive.
- The long description, cleaned on the server before it was saved.

Decisions:
- **Anchor verse in the KJV.** The verse is read from the KJV because its "unto the utmost bound of the everlasting hills" is where the church's name comes from. The default WEB reads "ancient hills". This needed a new public endpoint, `GET /public/programs/anchor`, so "anchor" is now a reserved slug.
- **Fonts are self-hosted** from `app/fonts` (DM Serif Display, Instrument Sans) with `next/font/local`, like the root layout's fonts. `next/font/google` fails at build time here, and Google Fonts was unreachable from this machine during the build.
- **Clock.** A minute-ticking hook starts from the server's render time, so the first client render matches the server HTML.

Tests, 6 of 6 passing (`components/programs/programs.test.tsx`):
- Live and the watch on now;
- the next time, in words, before it starts;
- the to-be-announced copy, the working name, and a program with no scripture;
- the rhythm strip's order and wording;
- grouping and the empty state;
- the Lagos-time wording helpers.

The backend Programs suite is at 42 of 42, with the anchor added.

Checks:
- I checked the pages by eye against a local backend running on the test database, with five programs and verses copied from production. Screenshots are taken in Phase 8.
- Fixed along the way: the name appearing twice on each card and on the detail hero, the groups looking empty, and a muddy hero cover.
