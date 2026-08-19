-- ─────────────────────────────────────────────────────────────────────────────
-- PWA / calendar / push notifications — Row-Level Security backstop
-- ─────────────────────────────────────────────────────────────────────────────
-- Applied out-of-band:
--   npx prisma db execute --file prisma/manual/2026-08-pwa-notifications-rls.sql --schema prisma/schema.prisma
--
-- SECURITY MODEL — identical to prisma/manual/2026-07-cms-rls.sql, deliberately.
--
--   The NestJS API is the enforcement layer. It connects as the Supabase
--   `postgres` role (which has BYPASSRLS) and scopes every query by `tenantId`
--   plus @Roles(...). These policies are a HARD BACKSTOP: any direct `anon` /
--   `authenticated` client that reaches these tables gets nothing.
--   Enabling RLS with no permissive policy = deny-all to every non-BYPASSRLS role.
--
--   True per-row tenant policies (SUPER_ADMIN cross-tenant bypass + tenant-scoped
--   member reads evaluated IN THE DATABASE) require the RLS-primary architecture:
--   per-request Supabase clients carrying the user JWT with a tenant claim. That
--   is a cross-cutting change deferred by design. Adding permissive policies here
--   before the API carries a tenant/role-bearing JWT would buy nothing (the
--   pooled connection bypasses them) while creating the false impression that
--   tenant isolation is enforced by Postgres. It is enforced in the service layer.
--
--   Consequently, for these four tables the per-member ownership rules
--   ("a member reads and writes only their own token / subscriptions /
--   preferences", "members read RecurringGathering; PASTOR and ADMIN write")
--   are enforced in the service layer against the authenticated principal, NOT
--   as SQL policies. Every query is filtered by tenantId AND the caller's own
--   userId; the .ics feed endpoint resolves the member from the feed token
--   server-side and applies that member's scope. No path uses the service role
--   key. See PWA_NOTIFICATIONS_ARCHITECTURE.md.
--
-- Idempotent: safe to re-run.

ALTER TABLE "CalendarFeedToken"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecurringGathering"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceAssignment"      ENABLE ROW LEVEL SECURITY;

-- No permissive policies are created intentionally: with RLS enabled and no
-- policy, only BYPASSRLS roles (the API's pooled `postgres` connection) can read
-- or write. `anon` and `authenticated` are denied. When the RLS-primary migration
-- lands, add tenant-scoped policies referencing the JWT tenant claim here — and
-- add them for the pre-existing tables in the same pass, so the model stays
-- uniform rather than half-migrated.
--
-- NOTE: nothing above weakens any existing RLS. These are five ENABLE statements
-- on five newly created tables; no existing table, policy, or grant is touched.
