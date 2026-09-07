# CLAUDE_PROMPT_READING_PLAN.md

Daily Bible Reading Plans for the EHC member dashboard.

**Do not write migrations or code until Section 12 (Where To Start) is satisfied. Schema approval is a hard gate.**

---

## 1. Objective

Give every member a daily scripture reading on the member dashboard, matched to their spiritual stage, that they can never fall behind on, that works with poor connectivity, and that a church can adapt to its own season.

Success is one loop, not a feature list:

> Member opens the dashboard → sees today's reading → reads it → marks it done → comes back tomorrow.

Everything in this document exists to serve that loop. Anything that does not serve it is Phase 3 or later.

## 2. Decisions already made (do not relitigate)

| Decision | Choice | Why |
|---|---|---|
| Levels | Maturity tracks: `NEW_BELIEVER`, `GROWING`, `MATURE` | Content differs by stage, not just volume |
| Scripture text | Self-hosted public domain (WEB + KJV) in Postgres | No licence risk, no rate limits, no external dependency, works offline |
| Scheduling | Personal day-index, progress-driven | A member is never "7 days behind". Day N advances on completion, not on the calendar |
| Authoring | Global templates + per-church copy-on-write fork | Tenants get a full library on day one and can still build a sermon-series plan |

## 3. Non-negotiable constraints

1. **No em dashes** in any copy, comment, seed content, or commit message.
2. **Reflection notes are pastoral-class data.** Same guardrail as prayer requests: member-only, never visible to any leader role, never sent to any AI pipeline, scrubbed from Sentry.
3. **Scripture text is the only corpus in this platform that is safe for an AI pipeline** (no member data in it). Note this for later embeddings work but build nothing AI-facing in this prompt.
4. **Daily reminders must be web push, never email.** Resend is capped at 100/day and a daily reading reminder is the highest-volume notification in the product. Sending it by email would burn the transactional headroom on day one.
5. All DDL runs via `prisma db execute`, never `prisma db push`. Pooler on 6543 for `DATABASE_URL`, direct 5432 for `DIRECT_URL`.
6. RLS on every new table, with tenant scoping. No exceptions.

## 4. The core primitive: integer verse IDs

Every passage in the system is a pair of integers.

```
verse_id = book_id * 1_000_000 + chapter * 1_000 + verse
```

Verified: Genesis 1:1 = `1001001`, John 3:16 = `43003016`, Psalm 119:176 = `19119176`, Revelation 22:21 = `66022021`. Maximum possible value is `66150176`, comfortably inside `INTEGER` (2,147,483,647). Do not use `BIGINT`.

Why this is the right primitive:

- Any passage, however it spans chapters or books, is `verse_id BETWEEN $start AND $end`. One btree range scan on the primary key.
- Canonical ordering is free. `ORDER BY verse_id` is scripture order.
- A range never leaks into a neighbouring book. Verified: `Gen 1:1 .. Gen 3:999` excludes Genesis 4:1 and Exodus 1:1.
- Translation swap is a change of one column in the `WHERE` clause, not a change of address scheme.

The alternative model, storing `(book, chapter, verse_start, verse_end)` per portion, cannot express a reading that crosses a chapter boundary without either a compound predicate or multiple rows. That is the single most common design mistake in reading-plan schemas. Do not make it.

**Versification note.** Pin authoring to the Protestant 66-book KJV versification. WEB and ASV agree with it almost everywhere. The handful of divergences (Psalm superscriptions, 3 John 14/15, Malachi and Joel chapter divisions in some traditions) are a known, accepted limitation for v1. Do not build a mapping table yet. Record the constraint in the code comment so the next person does not discover it as a bug.

## 5. Schema

Match `churches(id)` and `members(id)` to the actual tenant and member table names in the repo before running anything.

### 5.1 Scripture reference data (global, not tenant-scoped)

```sql
CREATE TABLE bible_translations (
  id          SMALLSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,              -- 'WEB', 'KJV', 'ASV'
  name        TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'en',
  licence     TEXT NOT NULL,                     -- 'public-domain' | 'licensed'
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one default across the table
CREATE UNIQUE INDEX bible_translations_single_default
  ON bible_translations ((is_default)) WHERE is_default IS TRUE;

CREATE TABLE bible_books (
  id             SMALLINT PRIMARY KEY,           -- 1..66 canonical order
  osis_code      TEXT NOT NULL UNIQUE,           -- 'Gen', 'Matt', 'Rev'
  name           TEXT NOT NULL,
  short_name     TEXT NOT NULL,
  testament      TEXT NOT NULL CHECK (testament IN ('OT','NT')),
  chapter_count  SMALLINT NOT NULL
);

CREATE TABLE bible_verses (
  translation_id  SMALLINT NOT NULL REFERENCES bible_translations(id) ON DELETE CASCADE,
  verse_id        INTEGER  NOT NULL,
  book_id         SMALLINT NOT NULL REFERENCES bible_books(id),
  chapter         SMALLINT NOT NULL,
  verse           SMALLINT NOT NULL,
  text            TEXT     NOT NULL,
  word_count      SMALLINT NOT NULL,
  PRIMARY KEY (translation_id, verse_id)
);
```

The primary key already serves `WHERE translation_id = $1 AND verse_id BETWEEN $2 AND $3`. Do not add a redundant index on the same columns.

`word_count` is populated at ingest and is what makes time-balanced plan generation possible in Section 6. It is not decoration.

Optional now, cheap forever, useful later:

```sql
ALTER TABLE bible_verses ADD COLUMN text_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;
CREATE INDEX bible_verses_fts ON bible_verses USING GIN (text_tsv);
```

Roughly 31,102 verses per translation. Two translations is about 62,000 rows and under 10 MB. This table will never be a scale problem.

### 5.2 Plans

```sql
CREATE TYPE reading_track AS ENUM ('NEW_BELIEVER','GROWING','MATURE','SEASONAL');
CREATE TYPE plan_status   AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');

CREATE TABLE reading_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NULL REFERENCES churches(id) ON DELETE CASCADE,  -- NULL = global template
  source_plan_id       UUID NULL REFERENCES reading_plans(id) ON DELETE SET NULL,
  slug                 TEXT NOT NULL,
  title                TEXT NOT NULL,
  subtitle             TEXT,
  description          TEXT,
  track                reading_track NOT NULL,
  duration_days        SMALLINT NOT NULL CHECK (duration_days BETWEEN 1 AND 1095),
  avg_minutes_per_day  SMALLINT,
  status               plan_status NOT NULL DEFAULT 'DRAFT',
  version              SMALLINT NOT NULL DEFAULT 1,
  cover_image_url      TEXT,
  created_by           UUID REFERENCES members(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reading_plans_slug_scope ON reading_plans (
  COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), slug, version
);
CREATE INDEX reading_plans_catalog ON reading_plans (tenant_id, track, status);

CREATE TABLE reading_plan_days (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id            UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  tenant_id          UUID NULL,                  -- denormalised from plan, for cheap RLS
  day_index          SMALLINT NOT NULL CHECK (day_index >= 1),
  title              TEXT,
  reflection_prompt  TEXT,
  reference_label    TEXT NOT NULL,              -- precomputed: 'Genesis 1-3 · Matthew 1'
  total_word_count   INTEGER NOT NULL DEFAULT 0,
  estimated_minutes  SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (plan_id, day_index)
);
CREATE INDEX reading_plan_days_tenant ON reading_plan_days (tenant_id);

CREATE TABLE reading_plan_portions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id     UUID NOT NULL REFERENCES reading_plan_days(id) ON DELETE CASCADE,
  tenant_id       UUID NULL,
  sequence        SMALLINT NOT NULL,
  label           TEXT,                          -- 'Gospel', 'Old Testament', 'Psalm'
  start_verse_id  INTEGER NOT NULL,
  end_verse_id    INTEGER NOT NULL,
  is_optional     BOOLEAN NOT NULL DEFAULT FALSE,
  word_count      INTEGER NOT NULL DEFAULT 0,
  CHECK (end_verse_id >= start_verse_id),
  UNIQUE (plan_day_id, sequence)
);
CREATE INDEX reading_plan_portions_tenant ON reading_plan_portions (tenant_id);
```

`reference_label`, `total_word_count`, and `estimated_minutes` are denormalised deliberately. The dashboard card must never compute a reading estimate at request time.

`tenant_id` is denormalised onto the child tables specifically so RLS policies do not need a subquery join back to `reading_plans`. See Section 7.

**Forks are deep copies, not references.** Forking copies the plan row plus all day and portion rows with a new `tenant_id` and `source_plan_id` set to the original. A 365-day plan with 3 portions per day is about 1,100 rows and a few hundred kilobytes. That cost buys the guarantee that updating a global template can never silently change what a church already published to its members.

**Published plans are immutable in v1.** Once `status = 'PUBLISHED'`, block any change to `duration_days`, any deletion of days, and any edit to portions. Allow title, subtitle, description, and `reflection_prompt` edits only. Full version-N+1 branching with subscription migration is Phase 4. Enforce this in the service layer and add a DB trigger as a backstop, because a member sitting on Day 87 must not have tomorrow rewritten underneath them.

### 5.3 Member subscription and progress

```sql
CREATE TYPE subscription_status AS ENUM ('ACTIVE','PAUSED','COMPLETED','ABANDONED');

CREATE TABLE member_plan_subscriptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_id          UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id            UUID NOT NULL REFERENCES reading_plans(id),
  plan_version       SMALLINT NOT NULL,
  translation_id     SMALLINT NOT NULL REFERENCES bible_translations(id),
  status             subscription_status NOT NULL DEFAULT 'ACTIVE',
  started_on         DATE NOT NULL,
  anchor_date        DATE NULL,                  -- reserved: non-null = calendar-anchored church plan
  timezone           TEXT NOT NULL DEFAULT 'Africa/Lagos',
  current_day_index  SMALLINT NOT NULL DEFAULT 1,
  completed_days     SMALLINT NOT NULL DEFAULT 0,
  current_streak     SMALLINT NOT NULL DEFAULT 0,
  longest_streak     SMALLINT NOT NULL DEFAULT 0,
  last_read_on       DATE NULL,                  -- member-local date
  grace_used_on      DATE NULL,
  reminder_hour      SMALLINT NULL CHECK (reminder_hour BETWEEN 0 AND 23),
  completed_at       TIMESTAMPTZ NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active personal plan. The anchor_date predicate leaves room for a
-- church-wide calendar plan to coexist later without a schema change.
CREATE UNIQUE INDEX member_one_active_personal_plan
  ON member_plan_subscriptions (member_id)
  WHERE status = 'ACTIVE' AND anchor_date IS NULL;

CREATE INDEX subs_reminder_sweep
  ON member_plan_subscriptions (reminder_hour, status)
  WHERE reminder_hour IS NOT NULL;

CREATE TABLE member_plan_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID NOT NULL REFERENCES member_plan_subscriptions(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL,
  member_id        UUID NOT NULL,
  day_index        SMALLINT NOT NULL,
  completed_on     DATE NOT NULL,                -- member-local date, not UTC
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  portions_done    SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (subscription_id, day_index)
);
CREATE INDEX progress_recent ON member_plan_progress (subscription_id, day_index DESC);

CREATE TABLE member_plan_reflections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID NOT NULL REFERENCES member_plan_subscriptions(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL,
  member_id        UUID NOT NULL,
  day_index        SMALLINT NOT NULL,
  body             TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, day_index)
);
```

`UNIQUE (subscription_id, day_index)` on progress is what makes completion idempotent. `INSERT ... ON CONFLICT DO NOTHING` means a double tap, a retried request, and an offline sync replay all produce the same result.

**Progress is sparse.** Only completed days get rows. Never pre-create 365 rows per subscriber.

## 6. Generating plans, not hand-authoring them

Do not write 1,095 day rows by hand. Declare each track as a spec and generate.

```ts
type Stream = {
  label: string;              // 'Gospel', 'Psalm'
  books: string[];            // OSIS codes, in reading order
  optional?: boolean;
};

type PlanSpec = {
  slug: string;
  title: string;              // member-facing, pastoral
  subtitle: string;
  track: ReadingTrack;
  durationDays: number;
  wordBudgetPerDay: number;   // drives balancing
  streams: Stream[];
};
```

The generator walks each stream and greedily packs whole chapters into a per-day word budget, using the `word_count` already on `bible_verses`.

```
for each stream:
  budget_for_stream = wordBudgetPerDay / number_of_streams
  cursor = first verse of first book
  for day in 1..durationDays:
    accumulate whole chapters until adding the next chapter would exceed
      budget_for_stream AND at least one chapter is already accumulated
    emit a portion { start_verse_id, end_verse_id, word_count }
    if a single chapter alone exceeds the budget, emit it alone
```

Two rules that matter:

- **Never split a chapter across days.** Chapter divisions are a 13th-century artifact and imperfect, but they are the smallest unit a reader recognises. A day ending mid-argument is worse than a day that runs slightly long.
- **Balance by words, not by chapters.** A chapter-per-day plan puts Psalm 117 (2 verses) and Psalm 119 (176 verses) on consecutive days. Word balancing removes that, and it is only possible because the schema carries `word_count`. This is the payoff for the ingest work.

Resolve `end_verse_id` against the real last verse of the chapter at generation time, not to a phantom `chapter * 1000 + 999`. Ranges stay exact and the reference label renders correctly.

At generation time also compute and store, per day: `reference_label`, `total_word_count`, and `estimated_minutes` (`round(total_word_count / 200)`, floor of 1).

### 6.1 The three seed tracks

Author these as global templates with `tenant_id = NULL`, `status = 'PUBLISHED'`.

**Track 1: `NEW_BELIEVER`. Slug `start-with-jesus`. 90 days, ~8 min/day, one portion.**
Days 1 to 30 John. Days 31 to 45 Mark. Days 46 to 60 Acts 1 to 12. Days 61 to 72 a curated Psalm set (1, 23, 27, 34, 37, 51, 62, 63, 84, 91, 103, 121, 130, 139, 145). Days 73 to 90 Philippians, 1 John, Romans 1 to 8.

**Track 2: `GROWING`. Slug `know-the-whole-story`. 365 days, ~15 min/day, two portions.**
Stream A: the whole New Testament. Stream B: Psalms then Proverbs, cycling.

**Track 3: `MATURE`. Slug `the-whole-counsel`. 365 days, ~28 min/day, four portions.**
M'Cheyne shape (public domain, 1842): Old Testament once, New Testament and Psalms twice. Stream A OT narrative spine, Stream B remaining OT, Stream C Gospels and Acts, Stream D Epistles and Revelation.

### 6.2 Naming is pastoral, the enum is technical

Keep `NEW_BELIEVER` / `GROWING` / `MATURE` in the database. **Never render those words in the UI.** No one selects "I am immature". Label every track by its promise:

- "Start with Jesus. Meet him in the Gospels. 90 days, about 8 minutes a day."
- "Know the whole story. The New Testament with a Psalm each day. One year, about 15 minutes."
- "The whole counsel. The entire Bible, Psalms and New Testament twice. One year, about 28 minutes."

Add a three-question router for the undecided ("How familiar are you with the Bible?", "How long each morning?", "Do you want to finish something soon or go deep?"). It costs almost nothing and it materially lifts the pick-a-plan conversion.

## 7. RLS

Enable RLS on every new table.

Reference data is world-readable to any authenticated user:

```sql
ALTER TABLE bible_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_books        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses       ENABLE ROW LEVEL SECURITY;

CREATE POLICY bible_verses_read ON bible_verses
  FOR SELECT TO authenticated USING (true);
-- same shape for books and translations
```

Plans: global templates readable by everyone, church plans readable only by that church, writable only by Pastor or Admin.

```sql
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY reading_plans_read ON reading_plans FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = (SELECT current_tenant_id()));

CREATE POLICY reading_plans_write ON reading_plans FOR ALL TO authenticated
  USING      (tenant_id = (SELECT current_tenant_id()) AND (SELECT has_role('PASTOR','ADMIN')))
  WITH CHECK (tenant_id = (SELECT current_tenant_id()) AND (SELECT has_role('PASTOR','ADMIN')));
```

**Wrap every function call in an RLS policy in a scalar subquery.** `(SELECT current_tenant_id())` is evaluated once as an InitPlan. A bare `current_tenant_id()` is re-evaluated per candidate row. On a table of any size that is the difference between a 2 ms query and a 2 second one. This is the single highest-leverage Supabase RLS habit and it applies to every policy in the codebase, not just these.

Because `tenant_id` is denormalised onto `reading_plan_days` and `reading_plan_portions`, their policies are the same predicate with no join. Keep the denormalised value correct with a trigger on insert that copies it from the parent plan, so the write path cannot drift.

Member data is member-only:

```sql
ALTER TABLE member_plan_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subs_own ON member_plan_subscriptions FOR ALL TO authenticated
  USING      (member_id = (SELECT current_member_id()))
  WITH CHECK (member_id = (SELECT current_member_id())
              AND tenant_id = (SELECT current_tenant_id()));
```

Same shape for `member_plan_progress` and `member_plan_reflections`.

### 7.1 What leaders can and cannot see

This is a product and pastoral decision, not only a technical one. "Sister X has not opened her Bible in nineteen days" is a pastoral care signal and a surveillance risk at the same time, and members can feel the difference.

- **Default:** leaders see aggregates only. Participation rate, plan popularity, cohort completion curve. Expose these through a `SECURITY DEFINER` function that returns counts, never rows.
- **Individual progress:** visible to a unit lead only if the member explicitly opts in, per subscription, with a clear toggle ("share my progress with my unit lead"). Store the flag on the subscription. Default off.
- **Reflections:** never visible to anyone but the author, at any role, ever. Not to Super Admin. Add a test that asserts this.

## 8. API surface

Split strictly by cacheability. Immutable content and private progress must never share an endpoint, or the private part poisons the cache for the public part.

**Immutable and CDN-cacheable** (`Cache-Control: public, max-age=31536000, immutable`, keyed by plan id plus version):

```
GET /reading-plans                              catalogue, filtered by track
GET /reading-plans/:planId                      plan detail + paginated day list
GET /reading-plans/:planId/days/:dayIndex       day + portions
GET /bible/passage?translation=WEB&start=1001001&end=1003024
```

The passage endpoint is the highest-leverage cache in the whole feature. Scripture text never changes. A 365-day plan across 3 portions and 2 translations is about 2,200 distinct passage URLs. That entire corpus fits comfortably in edge cache and reaches a hit rate near 99 percent within days.

**Private, never cached:**

```
GET    /me/reading-plan
POST   /me/reading-plan/subscriptions
PATCH  /me/reading-plan/subscriptions/:id            pause | resume | translation | reminder_hour
PUT    /me/reading-plan/subscriptions/:id/days/:dayIndex/complete
DELETE /me/reading-plan/subscriptions/:id/days/:dayIndex/complete
PUT    /me/reading-plan/subscriptions/:id/days/:dayIndex/reflection
```

**Address the mutation by the day it affects, never by an implied cursor.** `PUT .../days/87/complete` is idempotent by construction. `POST /complete-next` is not, and it breaks the moment a request is retried, a member double taps, or an offline queue replays. This one choice removes an entire class of bug from the offline sync path in Section 10.

`GET /me/reading-plan` returns references only, never scripture text:

```sql
SELECT s.id, s.plan_id, s.current_day_index, s.completed_days, s.current_streak,
       s.translation_id, p.duration_days, p.title,
       d.id AS day_id, d.title AS day_title, d.reference_label,
       d.estimated_minutes, d.reflection_prompt,
       po.sequence, po.label, po.start_verse_id, po.end_verse_id, po.is_optional
FROM member_plan_subscriptions s
JOIN reading_plans        p  ON p.id = s.plan_id
JOIN reading_plan_days    d  ON d.plan_id = s.plan_id AND d.day_index = s.current_day_index
JOIN reading_plan_portions po ON po.plan_day_id = d.id
WHERE s.member_id = $1 AND s.status = 'ACTIVE'
ORDER BY po.sequence;
```

One query, 1 to 4 rows, all index lookups. Text loads on the reading screen, not the dashboard.

## 9. Completion, streaks, and the timezone trap

Completion is a single transaction:

```
1. INSERT INTO member_plan_progress (...) ON CONFLICT (subscription_id, day_index) DO NOTHING
2. if inserted == 0: return current state unchanged   -- idempotent no-op
3. completed_days += 1
4. current_day_index = LEAST(completed_days + 1, plan.duration_days)
5. recompute streak (below)
6. if completed_days == duration_days: status = 'COMPLETED', completed_at = now()
```

Streak, computed on **write**, never on read, using the member-local date:

```
today = local date in subscription.timezone
if last_read_on == today:                      no change
elif last_read_on == today - 1 day:            current_streak += 1
elif last_read_on == today - 2 days
     and (grace_used_on is null or grace_used_on < today - 30 days):
                                               current_streak += 1
                                               grace_used_on = today
else:                                          current_streak = 1
longest_streak = GREATEST(longest_streak, current_streak)
last_read_on = today
```

The grace day matters. One missed day resetting a 60-day streak to zero is the single largest driver of abandonment in habit products, and in a church context it also produces shame, which is the wrong lever entirely. One free miss per 30 days, silently applied, never announced as "you used your grace".

**The timezone trap.** `completed_on` and `last_read_on` are member-local dates, derived server-side from `subscription.timezone`, never `CURRENT_DATE` in UTC. This is exactly the bug class already hit in the Gatherings module, where `toView` broke during the final UTC hour of each day. In Lagos (UTC+1) a member completing a reading at 00:30 local time is at 23:30 UTC the previous day. A naive implementation records it against yesterday, breaks the streak, and shows the same reading again. Write a test that pins the clock to 23:30 UTC and asserts the local date is tomorrow.

**Pace, never debt.** Compute `pace_delta = days_since_started - completed_days` for encouragement and analytics only. Never render "you are 7 days behind". Render "you have read 43 days" and, when `pace_delta > 2`, offer an optional "read two days today" catch-up affordance. The whole point of the day-index model is that there is no debt to display.

## 10. Offline: the feature that decides adoption

Lagos data is expensive and intermittent, and a reading plan is the single best offline candidate in the product because the content is deterministic and immutable.

- On a good connection, prefetch days `[current, current + 7]` and every passage in them into IndexedDB via the service worker.
- Reading works with no network. Completion writes queue locally and flush via Background Sync.
- Because `PUT .../days/:index/complete` is idempotent, replaying a queue after a week offline is safe with no dedupe logic, no client-side sequence numbers, and no reconciliation endpoint.
- Show a small "saved, will sync" state rather than a spinner or an error.

Prefetch on WiFi by default, with an explicit "download 30 days" control for members who want to load up before travelling.

## 11. Reminders

One hourly Cloud Scheduler job, not per-member cron.

```sql
SELECT id, member_id
FROM member_plan_subscriptions
WHERE status = 'ACTIVE'
  AND reminder_hour = $current_hour_for_timezone
  AND (last_read_on IS NULL OR last_read_on < $member_local_today);
```

Group by timezone, one pass per distinct timezone offset per hour. Fan out through Cloud Tasks (already in the stack, already credit-eligible) rather than looping in the request handler. Web push only, per Section 3.

## 12. Where to start (hard gate)

**Do not run a single migration until all four of these are answered in writing and approved:**

1. Confirm the actual table and column names for tenants and members (`churches.id`? `members.id`? or `church_id` on a `users` table?). Every FK in Section 5 depends on this.
2. Confirm the existing RLS helper functions and their exact names and signatures (`current_tenant_id()`, `current_member_id()`, `has_role(...)`), since roles are derived from assignment rows rather than JWT claims.
3. Confirm the public domain source files for WEB and KJV (ebible.org USFM, or `scrollmapper/bible_databases`), and that ingest runs as a committed one-time seed script with a checksum, never a runtime fetch.
4. Confirm whether `bible_verses` lives in the same Supabase database or a separate schema. Recommendation: same database, dedicated `scripture` schema, so it is obviously not tenant data.

Then proceed strictly in order. Report after each step and wait for confirmation before the next.

## 13. Phasing

**Phase 1: the loop.** Scripture DDL, ingest WEB + KJV, plan DDL + RLS, generator, seed three tracks, `GET /me/reading-plan`, `GET /bible/passage`, `PUT .../complete`, dashboard Today card, track chooser, reading screen. Ship nothing else until a member can complete a day.

**Phase 2: retention.** Streaks with grace, reflection notes, offline prefetch, push reminders, plan switching.

**Phase 3: church ownership.** Fork a global template, pastor authoring UI, sermon-series plans, publish to the congregation.

**Phase 4: insight.** Aggregate participation analytics, consented individual visibility for unit leads, plan versioning with subscription migration.

## 14. Tests that must exist before Phase 1 is done

1. Verse ID round trip: encode and decode across all 66 books, including Psalm 119:176 and Revelation 22:21.
2. A portion spanning a book boundary returns exactly the expected verses and no more.
3. Completion is idempotent: the same `PUT` five times yields `completed_days = 1`.
4. Streak with the clock pinned to 23:30 UTC in `Africa/Lagos` records tomorrow's local date.
5. Grace day: miss exactly one day, streak continues; miss two, streak resets to 1.
6. RLS: a member of church A cannot read church B's forked plan, its days, or its portions.
7. RLS: no role, including Super Admin, can read another member's reflection.
8. Editing a `PUBLISHED` plan's `duration_days` or portions is rejected.
9. Generated plan day count equals `duration_days` exactly, and no chapter is split across days.
10. Sentry `beforeSend` scrubs reflection bodies and passage content from any captured event.

## 15. Known scaling escape hatch (design for it, do not build it)

At around 1M subscribers, `member_plan_progress` approaches 365M rows per year. The move at that point is to collapse progress onto the subscription row as a bitmap: a 365-day plan is 365 bits, or 46 bytes, in a `bit varying(365)` column, with completion as `set_bit(...)`. That turns 365M rows into 1M rows, at the cost of per-day timestamps, which you keep in a rolling 90-day detail table.

This is premature at 10k and at 100k. Build the row-per-day model now, but **put every progress read and write behind a single repository class** so the storage shape can change later without touching a single call site. That is the whole point of naming the escape hatch now: not to build it, but to avoid designing yourself out of it.

---

*Anchor: "Thy word is a lamp unto my feet, and a light unto my path." Psalm 119:105*