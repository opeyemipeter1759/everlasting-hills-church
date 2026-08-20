# EHC frontend

Next.js 14 web application and PWA for Everlasting Hills Church.

## Setup

Use Node.js 20. Copy `.env.production.example` to `.env.local` and replace the
public URL placeholders. Server-only integration secrets are optional unless
their corresponding feature is enabled.

```bash
npm ci
npm run dev
```

The application runs at `http://localhost:3000`. Set the server-only
`API_BASE_URL` to the Nest origin (normally `http://localhost:4000` locally).

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The lint command is noninteractive and does not change files.

## Environment boundary

The frontend does not connect directly to PostgreSQL, administer Supabase
users, send backend email, or upload directly with R2 credentials. Accordingly,
it must not receive `DATABASE_URL`, `DIRECT_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, Resend keys, Paystack secrets, tenant IDs, or R2
access keys. Those belong only to the Nest backend.

Variables beginning with `NEXT_PUBLIC_` are embedded in the browser bundle and
must never contain secrets. `CMS_REVALIDATE_SECRET` and Telegram session values
are server-only and must not use that prefix.

Authenticated browser requests use the same-origin `/api/backend` BFF. Access
and refresh credentials remain in Secure, HttpOnly cookies and are attached to
Nest requests only by the Next.js server. `NEXT_PUBLIC_API_BASE_URL` is retained
only as a fallback for legacy server reads and browser-visible public calendar
links; prefer `API_BASE_URL` for all server-to-server traffic.

## API types

The API definitions are generated from the committed backend OpenAPI document;
the backend does not need to be running:

```bash
npm --prefix ../ehc-backend run openapi:generate
npm run gen:api
```

Commit `lib/api/generated/schema.d.ts` with its matching backend OpenAPI JSON.
