# EHC Feature Inventory

Component-level inventory of what exists and where. Created alongside the Usher Headcount work.

## Administrative Departments + Admin Head [NEW]

### Backend (`ehc-backend`)

| Item | Path |
| --- | --- |
| Prisma models `Department`, `DepartmentHead` + `Unit.departmentId` + `Role.ADMIN_HEAD` | `prisma/schema.prisma` |
| DDL (tables, role value, partial unique index, FKs, RLS) | `prisma/manual/2026-07-departments.sql` |
| Idempotent seed (7 departments + unit mapping) | `prisma/seed-departments.cjs` |
| Module | `src/departments/departments.module.ts` |
| Service (CRUD, head assignment with history, unit assignment, scope resolution, announcements, nudge, audit) | `src/departments/departments.service.ts` |
| Controller (`@Roles(ADMIN)` management, `@Roles(ADMIN_HEAD)` /mine) | `src/departments/departments.controller.ts` |
| Zod DTOs | `src/departments/dto/department.schema.ts` |
| `UsersService.ensureRoleAtLeast` (promotes head to ADMIN_HEAD) | `src/users/users.service.ts` |
| Role hierarchy (guard + user management + roles list + manageable roles) | `src/auth/guards/roles.guard.ts`, `src/users/role-hierarchy.ts`, `src/users/users.service.ts`, `src/users/dto/user.dto.ts` |

### API endpoints

| Method + path | Purpose | Access |
| --- | --- | --- |
| `GET /departments` | Index + unassigned units | ADMIN+ |
| `GET /departments/:id` | Detail + succession history | ADMIN+ |
| `POST/PATCH/DELETE /departments` | CRUD | ADMIN+ |
| `POST/DELETE /departments/:id/head` | Assign / end head tenure | ADMIN+ |
| `POST /departments/:id/units`, `DELETE /departments/:id/units/:unitId` | Assign / unassign units | ADMIN+ |
| `POST /departments/:id/announcements` | Department announcement | ADMIN+ |
| `GET /departments/mine` | Admin Head scope | ADMIN_HEAD+ |
| `GET /departments/mine/units/:unitId/roster` | Scoped roster (403 outside scope) | ADMIN_HEAD+ |
| `POST /departments/mine/announcements` | Scoped announcement | ADMIN_HEAD+ |
| `POST /departments/mine/units/:unitId/nudge` | Nudge a unit lead | ADMIN_HEAD+ |

### Frontend (`everlasting-hills-church`)

| Item | Path |
| --- | --- |
| React Query hooks + types | `lib/api/departments.ts` |
| Pastor/Admin console (index + unassigned quick-assign) | `components/dashboard/admin/departments/DepartmentsConsole.tsx` |
| Department detail (head, units, history, announcement) | `components/dashboard/admin/departments/DepartmentDetail.tsx` |
| Admin Head surface | `components/dashboard/admin/departments/MyDepartment.tsx` |
| Head person-picker | `components/dashboard/admin/departments/HeadPicker.tsx` |
| Routes | `app/dashboard/(dashboard)/departments/`, `app/dashboard/(dashboard)/my-department/` |
| Role-aware nav (Departments for ADMIN, My Department for ADMIN_HEAD only) | `config/config.ts` |
| Role maps | `config/config.ts`, `lib/auth/frontend-session.ts`, `lib/api/people.ts`, `components/dashboard/admin/people/peopleShared.tsx` |

### Design decisions locked

- Tenant column is `tenantId` (this repo's `church_id`); "FK to User" resolves to `Profile.id`.
- RLS is a deny-all backstop; enforcement is the API (postgres BYPASSRLS) plus per-request scope from active `DepartmentHead` rows.
- Hierarchy: `MEMBER < UNIT_LEAD < HEAD_USHER < ADMIN_HEAD < ADMIN < PASTOR < SUPER_ADMIN`. HEAD_USHER stays a lateral specialist; its behavior is unchanged.
- One active head per department (partial unique index); head history rows are never rewritten.
- `Unit.departmentId` is nullable; deleting a department sets its units unassigned (ON DELETE SET NULL).

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
