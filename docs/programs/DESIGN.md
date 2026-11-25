# Programs: design

Written before Phase 1, per `CLAUDE_PROMPT_PROGRAMS.md`. Decisions taken
without asking are also listed in `BUILD_REPORT.md`.

## 1. Problem analysis

The church runs five recurring programs (Prayer Watch, Dew of Heaven, Furnace,
the Homecoming Conference, Endyo). Each has a name, a rhythm, scriptures,
sometimes sessions (the four watches) and sometimes yearly editions (Furnace
'26). Visitors need:
- one place that shows what each program is;
- what is on right now and what is next;
- how to join.

The pastors need to change any of it without a developer.

## 2. Root cause: why a hardcoded page would fail

The facts change often and are partly unknown:
- dates are "to be announced";
- a conference name is provisional;
- one scripture is a suggestion;
- each Furnace has its own theme.

A hardcoded page would go stale the week it ships, so every correction would
need a deploy. Worse, "live now" and "next" depend on the clock in Lagos, which
only server-computed data can answer reliably. The Gatherings `toView` bug in the
last UTC hour of the day shows how easily client-side date guesses go wrong.

## 3. Architecture

**Module boundary.** I chose option (a): a new `ProgramsModule` in
`ehc-backend/src/programs/`.
- A Program is the identity and rhythm of a ministry meeting: brand, scriptures,
  cadence, story, sessions, editions.
- A `RecurringGathering` is a concrete online meeting with a join link and
  attendance.
- `Program.gatheringId` is an optional link for later use, with
  `ON DELETE SET NULL`. Nothing depends on it yet.
- The audit found no reason to merge the two. Gatherings has no scriptures,
  sessions, editions, media or publishing workflow.

**Data flow.**
1. Admin writes go through `@Roles(Role.ADMIN)` endpoints. The role hierarchy
   lets Admin, Admin Head, Pastor and Super Admin through, and sends Unit Lead,
   Member, Visitor and HOD away with 403.
2. Every write calls the existing `CmsRevalidateService`, which posts to the
   site's `/api/revalidate` with the tag `programs:<tenantId>`.
3. Public pages fetch `/public/programs` and `/public/programs/:slug` server
   side, tagged `programs:<tenantId>`, with `revalidate: 300` as a backstop.

**Time.** Occurrences are computed server side in Africa/Lagos:
- The `rrule` package walks local wall-clock dates. Each date is turned into a
  real instant with the Gatherings helper `buildGatheringOccurrenceStart`, which
  is offset-correct and DST-safe.
- The API returns occurrence windows (start and end) and session windows, not
  just labels. The page can then keep "LIVE" and "on now" correct between
  revalidations with a one-minute client tick, and never guesses dates itself.

**Scripture.**
- References are stored normalised: book id, chapter, verse range.
- They are checked on save against `BibleBook`.
- The text is read at request time from `BibleVerse` in the default translation,
  labelled with its code (WEB, KJV, ASV). No verse text is hardcoded.

**Media.** Logo and cover go through the existing R2 upload endpoint
(`POST /uploads/image`). This repo stores images in R2, not Supabase Storage.

## 4. Schema (additive, idempotent)

The migration is `ehc-backend/prisma/migrations/20261124130000_programs/`,
mirrored as `ehc-backend/prisma/sql/programs/001_programs.sql` with
`001_programs.down.sql`.
- It is applied with `prisma migrate deploy`. `MIGRATIONS.md` makes Prisma
  Migrate the schema history, so a side-channel `prisma db execute` would leave
  drift.
- The column naming follows the repo: PascalCase tables, camelCase columns and
  `tenantId`, not `church_id`.
- See the SQL file for the full DDL.

Tables:
- `Program`:
  - tenant, slug (unique per tenant), name, `nameStatus`, eyebrow;
  - short and long description (long is sanitised HTML);
  - `programType`, `cadence`, `recurrenceRule`, `startTime`, `durationMinutes`,
    `startOffsetDays`, `timezone`;
  - `dateStatus`, `format`, venue, `streamUrl`;
  - `logoUrl`, `coverUrl`, `accent` (a fixed enum, not free hex);
  - CTA label and url;
  - `status`, `featured`, `sortOrder`, optional `gatheringId`;
  - created/updated by and at.
- `ProgramScripture`: program, `bookId`, chapter, `verseStart`, `verseEnd`
  (with an optional end chapter), `scriptureStatus`, `sortOrder`.
- `ProgramSession`: program, name, `startTime`, `endTime`, description,
  `sortOrder`. A session may cross midnight.
- `ProgramEdition`: program, label, theme, `startsOn`, `endsOn`, `dateStatus`,
  summary, `recordingUrl`. An edition overrides the rule for its dates.

**`startOffsetDays`** covers the Homecoming weekend. The rule finds the last
Saturday of April, the offset of -1 starts the window on the Friday, and the
duration is 3 days.

**RLS.** RLS is on for every table.
- The API connects with the service role, so it is unaffected. Tenant scoping is
  enforced in the service layer, which is how every other module here works.
- One policy lets Supabase `anon` and `authenticated` read published rows only.
  It is created only when those roles exist, so a plain Postgres test database
  still migrates.
- The child tables follow their program's status.

## 5. Plan and tests per phase

| Phase | Work | Tests |
|---|---|---|
| 1 | Schema, RLS, seed | `anon` sees only published rows. Tenant A's queries never return tenant B's rows. The seed is idempotent and never overwrites admin edits. |
| 2 | Occurrence service | Every rule in the brief. Prayer Watch crossing midnight (live at 01:00 on Tuesday from Monday's watch). Calls at 23:00 to 23:59 UTC. TBA returns no occurrence. Editions override rules. Homecoming weekend offset. |
| 3 | Public API and ICS | Published only, other tenants never, scripture text resolved, ICS only for confirmed dates. |
| 4 | Admin API | All six roles (403 for Unit Lead, Member, Visitor). The PATCH that omits fields leaves them untouched. Reorder. Publish and archive audited. HTML sanitised. Revalidation called. |
| 5 | Public UI | Card states, LIVE badge, TBA copy, empty and error states. |
| 6 | Admin UI | Each schedule preset produces the right RRULE. Unsaved-changes guard. |
| 7 | Nav, revalidation, metadata | Nav order. `generateMetadata`. JSON-LD only for confirmed dates. |
| 8 | Verification | Full suites, lint, build, screenshots at 390 and 1440. |

## 6. Tradeoffs, performance, security, scale

**Tradeoffs.**
- Replace-the-collection endpoints for scriptures, sessions and editions, rather
  than per-row CRUD. A form saves its whole section in one transaction, and
  there is no half-saved order.
- A plain rich-text allowlist (`sanitize-html`, already in use) rather than a
  block editor.

**Performance.**
- A tenant has a handful of programs.
- The list endpoint does one query with includes, plus one verse query for all
  references (one `IN` on verse ids).
- The occurrence math is in memory and bounded: each rule is walked at most 400
  days ahead.
- Public pages are ISR, revalidated on write, so the database is hit once per
  write or per 5 minutes, not per visitor.
- The cards carry no images by default, which keeps LCP under budget on 4G.
  Logos load lazily with `next/image` sizes.

**Security.**
- Admin routes sit behind the role hierarchy. RBAC comes from assignment rows
  via `effectiveRoles`, never from JWT claims.
- Zod validates every body, and the update schema is explicit (not `.partial()`).
- Long descriptions are sanitised on the server. CTA, stream and recording URLs
  must be http or https.
- No personal data is stored.

**Scale (10k / 100k / 1M members across tenants).** Programs scale with tenants,
not members: about 10 rows per tenant. Indexes:
- `(tenantId, status, sortOrder)` for the public list;
- `(tenantId, slug)` unique.

The public read path is cached per tenant tag, so member growth only raises page
views, which ISR absorbs.

**Long-term view.**
- A Program can later link to a Gathering, so occurrences can carry attendance.
- Editions can link to recordings.
- When notifications arrive, the occurrence service is the single source for
  "starts soon".
