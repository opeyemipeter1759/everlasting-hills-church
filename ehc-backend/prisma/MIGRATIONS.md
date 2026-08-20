# Database migration runbook

This repository uses Prisma Migrate as the schema history. `prisma db push` and
`--accept-data-loss` are prohibited outside disposable local databases.

## What the baseline represents

`migrations/20260820000000_baseline/migration.sql` was generated offline from
the checked-in `schema.prisma`:

```bash
node node_modules/prisma/build/index.js migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script \
  --output prisma/migrations/20260820000000_baseline/migration.sql
```

It is the reproducible baseline for Prisma-managed tables, enums, constraints,
foreign keys, and indexes. The ordered post-baseline Paystack migration is
intentionally idempotent: it no-ops on fresh databases and installs the unique
index on an existing database after its baseline is recorded.

Prisma's datamodel does not describe every Supabase
object. In particular, legacy row-level-security policies, grants, functions,
and triggers from `prisma/manual/` are not proven by this offline baseline.
Audit those objects against a read-only production schema export and capture
the approved result in follow-up migrations before declaring a fresh database
production-equivalent.

## Fresh database

For an empty database, set `DIRECT_URL` to the direct PostgreSQL connection and
run:

```bash
npx prisma migrate deploy
```

Never apply the baseline SQL to a database that already contains application
tables.

## One-time baseline of the existing production database

This is an operator-controlled maintenance procedure, not a CI task.

1. Freeze schema changes and identify the exact release commit.
2. Create a full database backup and perform a restore rehearsal to a separate
   database. A backup that has not been restored is not yet verified.
3. Export the production schema read-only. Compare its Prisma-managed objects
   with `schema.prisma` and the baseline SQL. Separately audit RLS policies,
   grants, functions, triggers, and every file under `prisma/manual/`.
4. Confirm `_prisma_migrations` is absent or empty. If it contains any history,
   stop and reconcile that history; do not mark another baseline blindly.
5. Resolve every discrepancy with an explicit reviewed migration or by updating
   the datamodel and regenerating the baseline. Do not continue while drift is
   unexplained.
6. From the reviewed release artifact, record (without executing its SQL) that
   the already-existing schema satisfies the baseline:

   ```bash
   npx prisma migrate resolve --applied 20260820000000_baseline
   ```

7. Run `npx prisma migrate status`, then rehearse `npx prisma migrate deploy`
   against the restored staging database before running it in production.
8. Record the backup identifier, release commit, operator, timestamps, schema
   comparison, and command output in the deployment change record.

`migrate resolve --applied` writes migration history. It does not create or
alter the application tables represented by the baseline.

## Creating subsequent migrations

Create migrations against a disposable development database, review the SQL,
and commit both `schema.prisma` and the new migration directory:

```bash
npx prisma migrate dev --name concise_change_name
npx prisma validate
```

Never edit an already-applied migration. Add a new forward migration instead.
New deployable SQL is allowed only inside an ordered Prisma migration
directory. Files under `prisma/manual/` are legacy/historical references and
must be promoted into a reviewed ordered migration before deployment; never
apply them separately.

## Deployment and rollback

Production deployment is always:

```bash
npx prisma migrate deploy
```

Prisma does not provide automatic down migrations. Prefer backward-compatible
expand/contract releases:

1. Add new nullable columns/tables and deploy compatible code.
2. Backfill and verify.
3. Switch reads/writes.
4. Remove old structures in a later release.

For a failed additive migration, fix the cause and roll forward with another
reviewed migration. For destructive or partially applied changes, stop writes
and restore the verified backup according to the database incident procedure.
Do not delete rows from `_prisma_migrations` or manually reverse SQL in
production.

## Production workflow

The manual `Production database migration` workflow is protected by the GitHub
`production` environment and an explicit backup confirmation. Its read-only
preflight queries `_prisma_migrations` and refuses to deploy unless the baseline
is recorded as successfully applied. An unbaselined database therefore cannot
reach the deploy step. Configure required reviewers on the `production`
environment before adding its `DATABASE_URL` and `DIRECT_URL` secrets.

The workflow runs only `prisma migrate deploy`; it never runs `db push`. Before
each dispatch, operators must still verify a restorable backup, review pending
migrations, and rehearse them against a restored staging database.
