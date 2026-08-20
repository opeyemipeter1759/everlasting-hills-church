# EHC backend

NestJS 11 API for Everlasting Hills Church. PostgreSQL is accessed through
Prisma; Supabase provides authentication; Redis, Resend, Paystack, R2, Sentry,
and Web Push are optional integrations.

## Setup

Use Node.js 20. Copy `.env.production.example` to `.env` for local development
and replace every required placeholder.

```bash
npm ci
npm run start:dev
```

API documentation is served at `http://localhost:4000/docs` and its JSON form
at `http://localhost:4000/docs-json`.

## Commands

```bash
npm run typecheck
npm run lint
npm run lint:fix
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npx prisma validate
```

`npm run lint` is read-only. `lint:fix` is the only lint command that changes
files.

## OpenAPI

Generate the deterministic contract offline:

```bash
npm run openapi:generate
npm --prefix ../everlasting-hills-church run gen:api
```

The generator constructs the Nest dependency graph but never initializes or
listens on the application, so it opens no database, Redis, Supabase, or HTTP
connection. Commit `openapi/openapi.json` and the frontend's generated
`schema.d.ts` together.

## Environment

The validation source of truth is `src/config/env.validation.ts`. Production
requires database URLs, Supabase URL/anon key, a tenant ID, the frontend URL,
and independent CMS preview/revalidation secrets. Auth administration also
requires `SUPABASE_SERVICE_ROLE_KEY`.

Do not reuse a Supabase JWT secret for CMS signing. Generate independent values
with at least 32 random characters and rotate them separately.

Optional integrations fail closed or return an unavailable response when their
variables are absent. See `.env.production.example` for the complete inventory.

## Database releases

Never run `prisma db push`, `--accept-data-loss`, or ad-hoc SQL against a shared
database. All schema changes must be represented by a reviewed migration and
deployed with `prisma migrate deploy` after the production baseline has been
recorded. Follow [`prisma/MIGRATIONS.md`](prisma/MIGRATIONS.md).

## Production release order

1. Pass CI and review the migration/OpenAPI diffs.
2. Verify a restorable database backup.
3. Run `prisma migrate deploy` from the exact release artifact.
4. Deploy the backend and verify `/`, `/docs-json`, authentication, and logs.
5. Deploy the matching frontend contract/build.
6. Roll forward with a corrective migration if a schema release has a defect;
   restore the verified backup for destructive or irreversible failures.
