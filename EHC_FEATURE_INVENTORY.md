# EHC Feature Inventory

Component-level inventory of what exists and where. Created alongside the Usher Headcount work.

## Usher Headcount [NEW]

### Backend (`ehc-backend`)

| Item | Path |
| --- | --- |
| Prisma model `ServiceHeadcount` + `HeadcountStatus` enum | `prisma/schema.prisma` |
| Table DDL + CHECK constraints + RLS + `HEAD_USHER` enum value | `prisma/manual/2026-07-service-headcount.sql` |
| Module | `src/headcount/headcount.module.ts` |
| Service (computed total, variance, service-state gate, trend, audit) | `src/headcount/headcount.service.ts` |
| Controller (`@Roles(HEAD_USHER)`) | `src/headcount/headcount.controller.ts` |
| Zod input schema | `src/headcount/dto/headcount.schema.ts` |
| Role hierarchy (RolesGuard) | `src/auth/guards/roles.guard.ts` |
| Role hierarchy (user management) | `src/users/role-hierarchy.ts` |
| Growth trend + dashboard attendance card re-sourced | `src/admin/admin.service.ts` |

### API endpoints

| Method + path | Purpose | Access |
| --- | --- | --- |
| `GET /headcount/service/:serviceId` | Headcount for a service + can-record state | HEAD_USHER+ |
| `PUT /headcount/service/:serviceId` | Create / update / confirm headcount | HEAD_USHER+ |
| `GET /headcount/history` | Recent headcounts across services | HEAD_USHER+ |
| `GET /headcount/today` | Today's congregation total | HEAD_USHER+ |
| `GET /headcount/trend` | Trend + category breakdown, by service type | HEAD_USHER+ |
| `GET /admin/attendance-trend` | Growth chart (now headcount-sourced) | ADMIN+ |

### Frontend (`everlasting-hills-church`)

| Item | Path |
| --- | --- |
| React Query hooks + types | `lib/api/headcount.ts` |
| Mobile-first entry form (steppers, live total, variance) | `components/dashboard/admin/attendance/headcount/HeadcountEntryForm.tsx` |
| Section orchestrator (dual stat cards, entry-point, history) | `components/dashboard/admin/attendance/headcount/HeadcountSection.tsx` |
| Admin attendance page integration | `components/dashboard/admin/attendance/Attendance.tsx` |
| Check-ins card relabelled | `components/dashboard/admin/attendance/AttendanceStatCards.tsx` |
| Growth chart: category breakdown + first-timer trend | `components/dashboard/admin-overview/AttendanceTrendCard.tsx` |
| Trend point type + breakdown fields | `lib/mock/admin-dashboard.mock.ts` |
| Role hierarchy (session) | `lib/auth/frontend-session.ts` |
| Role hierarchy + labels + badge (config) | `config/config.ts` |

## Design decisions locked

- `children` is derived (`boys + girls`), never a stored column.
- `total = men + women + boys + girls`; `firstTimers` is an overlapping subset and is not added to `total`.
- Computed `total` is authoritative for analytics even when `reportedTotal` differs.
- One CONFIRMED headcount per service; post-confirmation edits are audited.
- Individual check-ins are untouched and remain per-member only.
- No service-role-key in the headcount path; access is via the NestJS API under the authenticated user, with an RLS deny-all backstop.
- `HEAD_USHER` was added as a dedicated role (a TODO in the original proposal, now shipped).

## Follow-ups / not yet done

- [ ] Per-row RLS policies (deferred until the RLS-primary JWT-tenant-claim migration; deny-all backstop is in place).
- [ ] Multi-usher reconciliation (a `HeadcountEntry` child table) if independent counts are ever wanted.
- [ ] A dedicated service-detail route with an Attendance tab (headcount currently lives on the main admin Attendance page; the detail-page section can reuse `HeadcountEntryForm` when that route exists).
