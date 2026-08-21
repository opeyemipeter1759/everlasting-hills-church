# Everlasting Hills Church

This repository contains two independently deployable applications:

- `ehc-backend/` — NestJS API, Prisma schema, background jobs, and integrations.
- `everlasting-hills-church/` — Next.js 14 web application and PWA.

Node.js 20 and `npm ci` are the supported CI/runtime baseline.

## Local development

Create local environment files from each application's production example, then
replace placeholders with development credentials. Never commit a populated
`.env` or `.env.local` file.

```bash
cd ehc-backend
npm ci
npm run start:dev
```

In a second terminal:

```bash
cd everlasting-hills-church
npm ci
npm run dev
```

The frontend defaults to port 3000 and the backend to port 4000.

## Quality gates

The pull-request workflow runs read-only linting, type checks, unit tests,
backend E2E tests, production builds, Prisma validation, and an OpenAPI drift
check. Run the same checks before opening a pull request:

```bash
npm --prefix ehc-backend run typecheck
npm --prefix ehc-backend run lint
npm --prefix ehc-backend test -- --runInBand
npm --prefix ehc-backend run test:e2e -- --runInBand
npm --prefix ehc-backend run build

npm --prefix everlasting-hills-church run typecheck
npm --prefix everlasting-hills-church run lint
npm --prefix everlasting-hills-church test
npm --prefix everlasting-hills-church run build
```

Lint commands never edit source files. Use the backend's explicit `lint:fix`
command only when you intend to apply fixes.

## API contract

Swagger discovers the complete Nest module graph. The checked-in OpenAPI JSON
and frontend TypeScript definitions are generated without starting a server or
connecting to external services:

```bash
npm --prefix ehc-backend run openapi:generate
npm --prefix everlasting-hills-church run gen:api
```

Commit both generated artifacts with every API change. CI rejects drift.

## Database and deployment

`prisma db push` is forbidden for shared environments. It does not provide an
auditable migration history and may drop data. Read
[`ehc-backend/prisma/MIGRATIONS.md`](ehc-backend/prisma/MIGRATIONS.md) before any
production database action, especially the one-time baseline procedure for the
existing Supabase database.

The production migration workflow is manual, protected by the GitHub
`production` environment, and refuses to deploy until the baseline has been
recorded. Operators must still verify a restorable backup and audit legacy RLS
objects before the first deployment.
