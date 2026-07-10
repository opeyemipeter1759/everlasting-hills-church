# EHC Platform Features

This document tracks shipped platform features. It was created alongside the Usher Headcount work; earlier features are summarised from the codebase and may be backfilled over time.

## Multi-role users, derived roles, and role-aware views [NEW]

Every user is a MEMBER first, and can hold several roles at once from one account.

- [x] Roles come from two sources: explicit grants (PASTOR, ADMIN, SUPER_ADMIN in `RoleGrant`) and roles derived from active assignments (UNIT_LEAD from `UnitLeadAssignment`, ADMIN_HEAD from `DepartmentHead`, HEAD_USHER from `HeadUsherAssignment`). MEMBER is the universal base.
- [x] A user's effective roles = MEMBER + grants + derived roles, resolved per request. Multiple roles coexist because they come from independent rows.
- [x] The single `Profile.role` column is retired: renamed to `legacyRole` (a frozen snapshot), never read for authorization. The whole backend (auth, guards, users, members, units) reads effective roles instead.
- [x] Roles are never baked into the JWT (identity only). They resolve server-side on every request, so a revocation or a replaced assignment takes effect on the very next request, with no stale-token power.
- [x] Delegated authority: an Admin Head can appoint and replace unit leads, but only for units in a department they actively head. Pastor and Admin can appoint on any unit. Appointing outside scope returns 403. Every appointment is audited with delegated attribution (acted as ADMIN_HEAD vs ADMIN or PASTOR).
- [x] One account, one dashboard shell: the sidebar stacks Member items plus MY UNIT (when the user leads a unit), MY DEPARTMENT (when they head one), the Usher surface, and ADMINISTRATION (Pastor/Admin), all at once. No mode toggle. The profile block shows the user's effective roles as chips.
- [x] History-preserving: revoking a grant or ending an assignment sets `endedAt`, never deletes. Partial unique indexes enforce one active grant per (user, role) and one active lead per unit.
- [x] RLS deny-all backstop on `RoleGrant`, `UnitLeadAssignment`, `HeadUsherAssignment`; a second church cannot read the first church's rows.
- [x] Idempotent backfill translated existing users into the new model (granted roles to grants, unit leads from `UnitMember.isLead`, head ushers to assignments), flagging any legacy UNIT_LEAD with no inferable unit for manual review. No user gained or lost access.

## Administrative Departments and the Admin Head role [NEW]

The seven Administrative Structures from the Church Administration document, made operational: departments group Service Units, each led by an Admin Head, so the Pastor supervises seven heads instead of sixteen unit leads.

- [x] Seven departments seeded per church (OSM, MA, CI, FIN, DATA, WPC, GO), each with a code, name, and sort order.
- [x] Service Units grouped under departments via a nullable `Unit.departmentId` (unassigned is a legitimate state).
- [x] `DepartmentHead` is history-preserving: assigning a new head ends the current tenure and opens a new one; a partial unique index enforces one active head per department, and a person may head several.
- [x] New `ADMIN_HEAD` role, ranked between HEAD_USHER and ADMIN. The role alone grants nothing; scope comes from active `DepartmentHead` rows. Assigning a head promotes the person to ADMIN_HEAD (never demotes admins) and syncs the JWT role claim.
- [x] Admin Head scope is strictly the departments they actively head: their units, unit leads, per-unit member counts, unit rosters, and department-scoped announcements and nudges. Everything outside their department is unreachable, including via direct API calls (403).
- [x] Enforced at three layers: RLS deny-all backstop on the new tables, NestJS role guards plus per-request scope resolution, and role-aware navigation.
- [x] Pastor/Admin surface at `/dashboard/departments`: seven department cards (head, unit and member counts), an Unassigned units section with quick-assign, and a detail page with head assignment (with a replace confirmation), unit assignment, succession history, and a department announcement composer.
- [x] Admin Head surface at `/dashboard/my-department`: their departments, units, leads, per-unit member counts, announcement composer, and unit-lead nudges, with a clear empty state when they hold the role but have no active assignment.
- [x] Idempotent seed matches existing units case-insensitively (tolerating a "Team"/"Unit" suffix), links them, creates missing units, creates Student Coordination unassigned, and reports units it could not confidently map.
- [x] Every mutation (create, update, delete, assign head, remove head, assign or unassign units, announce, nudge) writes to the audit log with actor, before, and after.

## Attendance

Two distinct, non-conflated attendance data sources:

### Usher headcount (aggregate, authoritative) [NEW]

- [x] `ServiceHeadcount` model: one authoritative aggregate count per service, scoped by `tenantId`.
- [x] Categories: men, women, boys, girls, first-timers. Children is derived (`boys + girls`), never stored.
- [x] `total` computed in the service layer as `men + women + boys + girls`. First-timers are an overlapping subset and are never added to the total.
- [x] Optional `reportedTotal` for reconciliation, with a variance indicator when it differs from the computed total. Computed total stays authoritative for analytics.
- [x] Database CHECK constraints enforce non-negative counts, the `total = sum` identity, and `firstTimers <= total`.
- [x] Status flow DRAFT to CONFIRMED. One row per service; edits after confirmation are allowed and audited.
- [x] Recording is gated: only permitted once a service is LIVE or ENDED, never while SCHEDULED.
- [x] Every create, update, and confirm writes to the shared `AuditLog` (actor, before, after, timestamp).
- [x] NestJS `headcount` module: thin controller, fat service, Zod-validated input. RLS deny-all backstop on the table.
- [x] Mobile-first entry form: large tappable steppers plus direct numeric input, a live computed total, variance indicator, and notes.
- [x] Headcount section on the admin Attendance page, clearly separated from individual check-ins, with dual stat cards (today's headcount vs today's check-ins) and a headcount history list.

### Individual check-ins (per-person) [unchanged]

- [x] One `AttendanceRecord` per person per service (self or admin marked).
- [x] Powers per-member attendance history, streaks, engagement scoring, and pastoral follow-up on named absent members.
- [x] Does NOT drive congregation-level growth analytics.

## Growth analytics

- [x] Attendance Trend growth chart now reads from `ServiceHeadcount.total`, not individual check-ins.
- [x] Sunday / Wednesday / All filter maps to service type, comparing like service to like service.
- [x] "vs start" percentage recalculated from headcount, per service type.
- [x] Category breakdown on the growth surface: men / women / children / first-timers over time, with first-timers viewable on its own (a key reach signal).
- [x] Congregation-level dashboard numbers (present-today headline, dashboard attendance card) sourced from headcount. Per-member metrics stay on check-ins.

## Roles and access

- [x] New `HEAD_USHER` role: can record and edit congregation headcounts without full admin rights. Ranked between UNIT_LEAD and ADMIN, so headcount routes admit head ushers plus all admins, while admin-only routes still exclude head ushers.
- [x] Role hierarchy updated across backend (RolesGuard, users role-hierarchy) and frontend (session, config).

## Public site CMS

- [x] Versioned draft / publish CMS for public pages (see CMS_ARCHITECTURE.md).
- [x] Structured editors for About, Beliefs, Ministries (+ per-group detail pages), Visit, Give, Contact, Sermons library header, Events, Privacy, Terms.
