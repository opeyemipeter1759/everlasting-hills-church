# Everlasting Hills Church (EHC) Platform — Full Feature Inventory

> Complete feature surface area, organized by functional domain.
> Companion to `EHC_FEATURES.md` (which organizes the same scope by phase).
> Anchored in Genesis 49:26 — *"unto the utmost bound of the everlasting hills."*

> **Status as of 2026-06-18.** Legend:
> `[x]` done · `[~]` partial / in progress · `[ ]` not started · `(+)` extra (built, not in original plan)
> A **What's Left → Phased Roadmap** section is at the bottom.

---

## Public Website

- [x] Home page with hero, vision, service times
- [x] About / vision / mission — `/about`
- [x] Beliefs page (five pillars from Genesis 49:22–26) — `/beliefs`
- [x] Lead pastor profile — `/pastor` (placeholder copy/photo, ready for real content)
- [~] Ministries overview + individual unit pages (public) — overview `/ministries` done; per-unit pages pending
- [x] Public sermon library + single sermon player
- [x] Upcoming events listing + event detail
- [x] Plan a visit page (location, service times, what to expect) — `/visit`
- [x] Contact form
- [x] Volunteer interest form (public) — `/connect/serve`
- [x] Connect form (first-timer pipeline entry) — `/connect`, `/first-timer`
- [x] Giving landing page — `/give`
- [ ] Blog / devotionals (optional)
- [x] Privacy policy + terms of service — `/privacy`, `/terms`
- [x] 404, 500, maintenance, unauthorized fallback pages — `not-found`, `error`, `global-error`
- [x] (+) Public Q&A / questions page — `/questions`
- [x] (+) Standalone prayer-request page — `/prayer-request`
- [x] (+) Standalone testimony page — `/testimony`
- [x] (+) Quick links page — `/quick-links`
- [x] (+) Dedicated feature-event page — `/events/heaven-on-earth`

---

## Authentication & Identity

- [x] Email + password signup and login
- [x] Phone number as temporary password (first-timer conversion)
- [x] Forced password change on first login
- [x] Forgot password + reset flow
- [ ] Email verification
- [x] Session management (JWT-based)
- [ ] Two-factor authentication
- [ ] Active sessions view + remote sign-out
- [ ] Onboarding flow (post-signup profile completion)
- [~] Multi-tenant `church_id` resolution at login (Tenant model exists; resolution partial)

---

## RBAC & Permissions

- [x] Role model — **6 roles** built (Super Admin, Pastor, Admin, UnitLead, Member, Visitor); plan called for 4 (+)
- [x] Role-filtered dashboard (one dashboard, role-aware views)
- [x] Middleware enforcement at route segment boundary
- [x] Service-layer permission checks
- [ ] Custom permission overrides per user
- [~] Audit log of role changes (`RoleAssignment` model exists; audit-log UI is a stub)
- [x] Role assignment workflow (who can promote whom)

---

## Member Management

- [x] First-timer submission pipeline
- [x] Admin review and approval of first-timers
- [x] First-timer to member conversion engine
- [x] Member directory (admin)
- [x] Member detail view with full history
- [x] Member profile editing (self)
- [x] Profile photo upload
- [ ] Bulk member import (CSV)
- [ ] Member tagging and segmentation
- [ ] Family / household grouping
- [x] Birthday and anniversary tracking
- [x] Member notes (pastoral, private)
- [x] Member status states (active, inactive, transferred, deceased)

---

## Attendance

- [x] Self check-in (member side)
- [x] Admin / UnitLead manual check-in
- [x] Time-window enforcement (only while service is active)
- [ ] Geofence verification
- [ ] Device fingerprint verification
- [ ] Anti-gaming controls (one check-in per service per device)
- [~] Admin override
- [~] Live attendance count
- [~] Percentage vs expected attendance (via analytics)
- [x] Who is present / who is absent view
- [~] Per-service attendance history
- [x] Member attendance percentage (personal)
- [x] Last attended date (personal)
- [ ] CSV export of attendance data
- [~] Service session management (create, open, close) — `Service` model exists; UI is a stub
- [~] Unit-scoped attendance for UnitLeads (via analytics)

---

## Sermons & Content

- [x] Sermon CMS (create, edit, delete)
- [~] Audio upload to Cloudflare R2 (R2 wired for images; audio path unconfirmed)
- [~] Speaker management
- [x] Series management
- [~] Scripture tagging
- [~] Topic / theme tagging
- [x] Public sermon page with embedded player
- [x] Personal saved sermons (member) — `SermonBookmark`
- [~] Sermon recommendations (recent service)
- [~] Keyword search
- [ ] Download permissions (member-only or public)
- [x] Sermon notes / outline attachment — `SermonNote`

---

## Events

- [x] Event CMS (create, edit, delete)
- [x] Event detail page
- [x] RSVP flow
- [ ] Registration with capacity limits
- [ ] Event categories (service, conference, outreach, social)
- [ ] Recurring events
- [ ] Event reminders (email + in-app)
- [ ] Personal events view (events you are registered for)
- [x] Registration list for admins
- [ ] Unit-scoped events

---

## Giving (Paystack)

> **Data model + analytics exist; no transactional payment engine yet.**

- [ ] One-time donation / tithe / offering form (live payment)
- [ ] Recurring giving (subscriptions)
- [ ] Paystack transaction initialization
- [ ] Webhook handler with HMAC verification (`PaystackWebhookLog` model exists)
- [ ] Idempotent webhook processing
- [~] Member giving history (`GivingRecord` model exists)
- [ ] Downloadable giving statements
- [ ] Email receipts (per transaction)
- [ ] Year-end tax / contribution statements
- [ ] Designated funds (building fund, missions, etc.)
- [x] Pastor-level financial reports (analytics: trend, categories, summary, top-donors)
- [ ] Transaction reconciliation view
- [ ] Failed payment retry logic
- [ ] Refund management

---

## Communications

- [x] Transactional email via Resend (welcome email)
- [ ] Announcement broadcast (church-wide) — UI is a stub
- [ ] Unit-scoped announcements
- [x] Email templates (welcome, first-timer follow-up, birthday, anniversary)
- [~] In-app notification center (event-driven service exists; no API/UI yet)
- [ ] Push notifications (mobile / PWA, later)
- [ ] SMS notifications (later, behind feature flag)
- [ ] Notification preferences per user

---

## Community & Real-time

- [~] Community feed (church-wide)
- [ ] Channels (per ministry unit, per interest)
- [ ] Direct messages (1:1)
- [ ] Group messages
- [ ] Real-time message delivery (socket.io installed; no gateway yet)
- [ ] Reactions and replies (threaded)
- [x] Prayer request submission and feed
- [x] (+) Q&A discussions (`DiscussionQuestion` / `DiscussionResponse`)
- [ ] Moderation tools: flag, mute, ban, delete
- [ ] Content reports queue for admins
- [ ] Profanity / spam filtering
- [ ] Read receipts

---

## Ministry Units

- [x] Unit directory
- [~] Unit detail page (members, leadership)
- [x] Unit membership management
- [ ] Unit-specific announcements
- [ ] Unit-specific events
- [~] Unit-specific attendance (via analytics)
- [~] UnitLead dashboard (role-branched)
- [ ] Volunteer commitment tracking per unit

---

## Inventory & Equipment

> **Not started — no model, no module. UI is a "Coming Soon" stub.**

- [ ] Equipment register (PA, instruments, video, backdrop)
- [ ] Item detail with photos and serial numbers
- [ ] Assignment to units or individuals
- [ ] Maintenance schedule and history
- [ ] Status (in use, in storage, under repair, retired)
- [ ] Asset value tracking
- [ ] Audit log of movements

---

## Analytics & Reporting

### Essentials tier

- [x] Attendance trends and growth charts
- [x] Membership growth over time
- [x] First-timer conversion rate
- [x] Giving totals and trends

### Intelligence tier

- [ ] Member retention curves
- [x] Engagement scoring per member (`EngagementScore`)
- [x] Unit and department performance
- [ ] Giving correlated with attendance
- [x] At-risk member identification

### Advanced tier

- [~] Pastoral alerts (`PastoralAlert` model exists; UI is a stub)
- [ ] Cohort analysis (joined in same quarter, behavior over time)
- [ ] Predictive churn modeling
- [ ] Custom report builder (UI is a stub)
- [ ] Exportable PDFs for leadership meetings

---

## AI Features

> **Not started.** `AIInsightsCard` on the admin dashboard is a UI placeholder (mock data).

- [ ] Sermon embeddings via pgvector
- [ ] Semantic sermon search
- [ ] Engagement intelligence (which members need attention)
- [ ] Intelligent follow-up recommendations
- [ ] Automated content generation (announcement drafts, follow-up messages)
- [ ] Sermon transcription
- [ ] Sermon summarization
- [ ] AI chatbot assistant (member-facing Q&A on church info, beliefs, service times)
- [ ] Pastoral question answering grounded in the sermon library

---

## SaaS / Multi-tenant Platform

- [~] Multi-tenancy (`tenant_id` / `church_id` on every table) — `Tenant` model exists; not enforced everywhere
- [ ] Row Level Security on every table
- [ ] Per-church branding (colors, logo, name)
- [ ] Per-church domain / subdomain
- [x] Per-church service times and locations (via Site Settings)
- [ ] Plan tiers (Starter, Growth, Enterprise)
- [ ] Billing (recurring SaaS subscription)
- [ ] Usage limits per plan (members, storage, sends)
- [ ] Church onboarding flow (new tenant signup)
- [~] Super-admin console (SUPER_ADMIN role exists; cross-tenant console pending)
- [ ] Tenant data export
- [ ] Tenant suspension and offboarding

---

## System & Operations

- [~] Audit log of all sensitive actions (UI is a stub)
- [x] Background job runner (BullMQ email queue; in-process fallback when REDIS_URL unset)
- [~] Scheduled tasks (cron live; birthday emails done, anniversary placeholder pending DB field, weekly digest stubbed)
- [x] Error monitoring integration (Sentry; activates when SENTRY_DSN set)
- [x] Health check endpoints
- [ ] Backup and restore for tenant data
- [ ] GDPR / data privacy: data export and right-to-deletion per member

---

## Site Settings / Content Management (+)

> Extra domain not in the original inventory.

- [x] Dynamic homepage content management (`/dashboard/settings/homepage`)
- [x] Section-based site settings (`SiteSettings` / `SiteSection`)
- [x] Image picker / uploader to Cloudflare R2

---

## Testimonials (+)

> Extra domain not in the original inventory.

- [x] Public testimony submission (`/testimony`)
- [x] Testimonials CMS / moderation (`/dashboard/testimonials`)
- [x] `Testimonial` model + API

---

## Mobile / PWA (later horizon)

- [x] Mobile-first responsive web
- [ ] Installable PWA
- [ ] Offline tolerance for sermon listening
- [ ] Native mobile apps (iOS, Android) using shared API

---

# What's Left → Phased Roadmap

> Everything still open (`[ ]` / `[~]`), sequenced so each phase unblocks the next.

## Phase A — Complete the Public Site ✅ *(done 2026-06-18)*

- [x] About / vision / mission page — `/about`
- [x] Beliefs page (five pillars) — `/beliefs`
- [x] Lead pastor profile page — `/pastor` (placeholder content, swap in real name/photo/bio)
- [~] Public ministries overview + individual unit pages — overview `/ministries` done; per-unit pages still open
- [x] Plan-a-visit page — `/visit`
- [x] Privacy policy + terms of service — `/privacy`, `/terms`
- [x] 404 / 500 / maintenance / unauthorized fallback pages — `not-found.tsx`, `error.tsx`, `global-error.tsx`
- [ ] Blog / devotionals (optional)

## Phase B — System Foundations ✅ *(done 2026-06-18)*

- [x] Background job runner (BullMQ) — `src/jobs`; in-process fallback when REDIS_URL unset
- [~] Scheduled tasks — cron runtime live (`src/scheduling`); birthday emails done, anniversary placeholder pending DB field, weekly digest stubbed
- [x] Error monitoring integration (Sentry) — `src/observability/instrument.ts`; activates with SENTRY_DSN
- [x] Email template set (first-timer follow-up, birthday, anniversary) — `src/notifications/templates`

## Phase C — Giving / Payments *(unlock a whole domain; models + analytics already exist)*

- [ ] Paystack transaction initialization
- [ ] Webhook handler with HMAC verification + idempotency
- [ ] One-time donation / tithe / offering live form
- [ ] Email receipts per transaction
- [ ] Member giving history UI
- [ ] Recurring giving (subscriptions) — depends on Phase B
- [ ] Designated funds
- [ ] Downloadable + year-end statements
- [ ] Transaction reconciliation view
- [ ] Failed payment retry + refund management

## Phase D — Communications & Notifications

- [ ] In-app notification center (API + UI)
- [ ] Notification preferences per user
- [ ] Announcement broadcast (church-wide)
- [ ] Unit-scoped announcements
- [ ] SMS notifications (feature-flagged)

## Phase E — Attendance & Events Hardening

- [ ] Service session management UI (create / open / close)
- [ ] Live attendance count + percentage vs expected
- [ ] Geofence + device fingerprint + anti-gaming controls
- [ ] Admin override + per-service history polish
- [ ] CSV export of attendance
- [ ] Event capacity limits + categories
- [ ] Recurring events + reminders (depends on Phase B)
- [ ] Personal "my events" view + unit-scoped events

## Phase F — Member & Unit Depth

- [ ] Bulk member import (CSV)
- [ ] Member tagging / segmentation
- [ ] Family / household grouping
- [ ] Unit detail page completion
- [ ] Unit-specific announcements + events
- [ ] Volunteer commitment tracking per unit

## Phase G — Sermons Enrichment

- [ ] Audio upload to R2 (confirm/finish)
- [ ] Speaker management
- [ ] Scripture + topic tagging
- [ ] Keyword search + recommendations polish
- [ ] Download permissions

## Phase H — Analytics & Reporting (advanced)

- [ ] Pastoral alerts UI (model exists)
- [ ] Custom report builder
- [ ] Exportable PDFs for leadership
- [ ] Member retention curves
- [ ] Giving-correlated-with-attendance
- [ ] Cohort analysis
- [ ] Audit-log UI (sensitive actions)

## Phase I — Community & Real-time

- [ ] Real-time gateway (socket.io)
- [ ] Community feed
- [ ] Channels (per unit / interest)
- [ ] Direct + group messages
- [ ] Reactions / threaded replies / read receipts
- [ ] Moderation tools + reports queue + profanity filter

## Phase J — AI Features

- [ ] Sermon embeddings (pgvector) + semantic search
- [ ] Sermon transcription + summarization
- [ ] Engagement intelligence + follow-up recommendations
- [ ] Automated content generation
- [ ] AI chatbot assistant + pastoral Q&A grounded in sermon library

## Phase K — SaaS / Multi-tenant Platform

- [ ] Enforce `tenant_id` on every table + Row Level Security
- [ ] Per-church branding (colors, logo, name)
- [ ] Per-church domain / subdomain
- [ ] Plan tiers + billing + usage limits
- [ ] Church onboarding flow (new tenant signup)
- [ ] Super-admin cross-tenant console
- [ ] Tenant data export + suspension/offboarding

## Phase L — Inventory & Equipment *(self-contained; schedule when needed)*

- [ ] Equipment register + item detail (photos, serial numbers)
- [ ] Assignment to units / individuals
- [ ] Maintenance schedule + history
- [ ] Status tracking + asset value + movement audit log

## Phase M — Auth Hardening & Compliance

- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Active sessions view + remote sign-out
- [ ] Post-signup onboarding flow
- [ ] Custom per-user permission overrides
- [ ] GDPR data export + right-to-deletion
- [ ] Backup and restore for tenant data

## Phase N — Mobile / PWA *(later horizon)*

- [ ] Installable PWA
- [ ] Offline tolerance for sermon listening
- [ ] Native mobile apps (iOS, Android) on shared API

---

## How to Use This File

This is the **domain view** of EHC's full surface area, with live build status. Use it for:

- Scoping conversations about a single domain ("everything we plan to build for attendance")
- Tracking what's done vs. left (`[x]` / `[~]` / `[ ]`)
- Sprint planning via the **Phased Roadmap** above
- Onboarding contributors quickly to what the platform is and will become

For **session-to-session state**, see `HANDOFF.md`.

---

## House Style Rules

- No em dashes in generated copy or prose
- Brand voice informed by Genesis 49:26
- Burgundy `#87102C`, deep burgundy `#4a0819`, crimson `#8B1A3A`
- Chip `#FFE8ED`, pink border `#E7CDD3`, blush `#FBEAF0`, ink `#080808`
- DM Serif Display + Instrument Sans
- Custom ease `[0.22, 1, 0.36, 1]`
- Final approved web aesthetic: deep black (`#080808`) base, white-dominant glassmorphism, burgundy as sparse accent
