# EHC Platform Features

This document tracks shipped platform features. It was created alongside the Usher Headcount work; earlier features are summarised from the codebase and may be backfilled over time.

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
