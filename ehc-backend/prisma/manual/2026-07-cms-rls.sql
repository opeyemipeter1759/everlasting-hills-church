-- ─────────────────────────────────────────────────────────────────────────────
-- Public-site CMS — Row-Level Security backstop
-- ─────────────────────────────────────────────────────────────────────────────
-- Applied out-of-band (prisma db push does not manage RLS):
--   npx prisma db execute --file prisma/manual/2026-07-cms-rls.sql --schema prisma/schema.prisma
--
--
 SECURITY MODEL (see CMS_ARCHITECTURE.md):
--   The NestJS API is the enforcement layer. It connects as the Supabase
--   `postgres` role (which has BYPASSRLS) and scopes every query by `tenantId`
--   plus @Roles(SUPER_ADMIN, PASTOR). These policies are a HARD BACKSTOP: any
--   direct `anon` / `authenticated` her client that reaches these tables gets nothing.
--   Enabling RLS with no permissive policy = deny-all to every non-BYPASSRLS role.
--
--   True per-row tenant policies (SUPER_ADMIN cross-tenant + PASTOR tenant-scoped
--   evaluated in the database) require the RLS-primary architecture: per-request
--   Supabase clients carrying the user JWT with a tenant claim. That is a
--   cross-cutting change deferred by design; do not add permissive policies here
--   until the API actually connects with a tenant/role-bearing JWT.
--
-- Idempotent: safe to re-run.

ALTER TABLE "Page"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"       ENABLE ROW LEVEL SECURITY;

-- No permissive policies are created intentionally: with RLS enabled and no
-- policy, only BYPASSRLS roles (the API's pooled `postgres` connection) can read
-- or write. `anon` and `authenticated` are denied. When the RLS-primary migration
-- lands, add tenant-scoped policies referencing the JWT tenant claim here.
