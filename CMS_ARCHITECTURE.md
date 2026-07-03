# CMS Architecture

How the public-site CMS stores, versions, publishes, and secures content. Adapted
to this repo's actual conventions (see "Reconciliation" below).

## Reconciliation with the build spec

The original spec was written against a differently-structured project. This
implementation adapts it to the real codebase:

| Spec | This implementation |
|---|---|
| `church_id` scoping | `tenantId` (the repo's established convention) |
| Prisma **migrations** | `prisma db push` + tracked SQL in `prisma/manual/` (no migrations dir) |
| RLS as the enforcement layer | **Service-layer enforcement is primary** (`@Roles` + `tenantId` filter). RLS is a hard **backstop** — see Security |
| New `SiteSettings` table | `SiteSettings` already existed; the CMS is the versioned layer beside it |
| "existing `audit_log`" | New `AuditLog` model (none existed) |
| Normalized `ContentBlock` table | Blocks live as a **portable JSON array** inside `ContentVersion.content` |

## Content model

Four tables (`ehc-backend/prisma/schema.prisma`), all `tenantId`-scoped:

- **`Page`** — one row per public route (`key`, e.g. `home`, `about/beliefs`, `give`).
  Holds `title`, `status`, `cacheTag`, `featureFlag`, and `publishedVersionId` —
  the pointer the public site reads from. Created lazily on first edit; the full
  catalogue of editable pages is the static `page-registry.ts`.
- **`ContentVersion`** — immutable content snapshots (`version` monotonic per page).
  Drafts are the newest non-published rows; history is every row; rollback creates
  a new version from an old snapshot and republishes it (append-only).
- **`MediaAsset`** — R2-backed media. Stores the object **key**, never a public URL;
  the URL is generated at read time from `R2_PUBLIC_URL`. `alt` is required.
- **`AuditLog`** — generic actor/action/entity/before/after trail (platform-wide).

Enum `ContentStatus { DRAFT | PUBLISHED | ARCHIVED }`.

## Block format (portable)

`ContentVersion.content` is `{ blocks: Block[] }` — a constrained, framework-agnostic
JSON schema (a simplified Tiptap model), validated by Zod in
`src/cms/schemas/blocks.schema.ts`. Allowed blocks: `heading` (h2/h3), `paragraph`,
`image`, `quote`, `list`, `divider`, `video`, `cta`, plus entity-reference blocks
`featuredSermon` / `featuredEvent` (resolved against other modules at read time).
No arbitrary HTML, no inline styles — each block maps 1:1 to a public-site component,
and the shape is portable to a future mobile renderer.

## Publish workflow

1. Editors save a **draft** (`POST /cms/pages/:key/draft`) — validated, never live.
   If the newest version is already published, a new draft version is started on top.
2. **Publish** (`POST /cms/pages/:key/publish`) marks the working version
   `PUBLISHED` and sets `Page.publishedVersionId`. The public read path
   (`GET /cms/public/:key`) selects **only** that pointed row — it never joins to
   drafts.
3. **Rollback** (`.../versions/:n/restore`) copies an old snapshot into a new
   version and publishes it. History stays append-only.

## Preview

`POST /cms/pages/:key/preview-token` mints an HMAC-signed token (1-hour TTL).
`GET /cms/preview?token=…` (public) verifies it and returns the **draft** content —
letting an editor see unpublished changes without exposing drafts publicly.

## Cache invalidation (wired in Phase B)

Every `Page` carries a `cacheTag` (`cms:<key>`) mirroring its public route. On
publish/rollback the API returns `{ route, cacheTag }`; the Next.js admin then calls
a revalidation route handler that runs `revalidateTag` / `revalidatePath` for that
route. (Backend cannot call Next's `revalidate*` directly — that runs in the Next
runtime.)

## Security

- **Primary:** the NestJS API enforces authorization. Every CMS route is
  `@Roles(PASTOR)` (Pastor + Super Admin per the role hierarchy) except the two
  public reads, and every query filters by `tenantId`. This matches how every other
  module in the codebase enforces tenancy.
- **Backstop:** `prisma/manual/2026-07-cms-rls.sql` enables RLS on all four tables
  with **no permissive policy** — deny-all to every non-`BYPASSRLS` role. The API's
  pooled `postgres` connection bypasses RLS; any stray `anon`/`authenticated` client
  gets nothing. True per-row tenant policies require the RLS-primary architecture
  (per-request Supabase clients carrying a tenant JWT claim) and are intentionally
  deferred.
- Media keys are never public; URLs are derived at read time. Preview tokens are
  signed and short-lived. The service-role key is never used in the CMS request path.

## Scale

Public reads are a single indexed lookup (`Page` + pointed `ContentVersion`) behind
ISR — flat cost at 10k/100k/1M. Version history grows fastest; indexes lead with
`tenantId`, and old snapshots can be pruned/archived per page. Media scales
independently on R2.

## Phase status

- **Phase A (done):** schema + RLS backstop, `CmsModule` (pages, versioning,
  publish/unpublish, rollback, preview, media, audit), `/dashboard/cms` shell,
  media library, audit view.
- **Phase B+:** block editor (Tiptap), site-settings + homepage editors, ISR
  revalidation on publish, then About/Ministries/Contact, Visit/Give/Legal/Fallback,
  Blog (flagged), and version-history UI / diff / restore.
