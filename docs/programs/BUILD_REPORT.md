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
