# Everlasting Hills Church — Project Build Analysis

> Snapshot taken 2026‑06‑01. Covers backend (NestJS) and frontend (Next.js 14)
> work landed during this session: auth flows, member self‑service, hard‑delete
> cascade, dynamic homepage content, admin editor.

---

## 1. What got built

### 1.1 Backend — `ehc-backend/`

**New modules / endpoints**

| Module | Endpoints added | Notes |
|---|---|---|
| Auth | `POST /auth/forgot-password`, `POST /auth/change-password` | Change‑password rewritten twice to land on the admin‑client write path. The SDK silently no‑ops with just a global Authorization header. |
| Members | `PATCH /members/me`, `POST /members/me/avatar`, `DELETE /members/me/avatar`, `DELETE /members/:id` | Avatar uploads go to Cloudflare R2 via `@aws-sdk/client-s3`. Hard‑delete cascades through 11 child tables in a single transaction then removes the Supabase auth user. |
| Users | `DELETE /users/:profileId` (hard delete, not soft) | Same cascade as `members/:id`. Old `deactivate` retained as a separate method. |
| Forms | `POST /forms/contact` | |
| Notifications | Extended `SendEmailPayload` with optional `html`; new `member-welcome-email.ts` template | Welcome email built once, fired from both admin create AND visitor‑converted paths. |
| **Site Settings** | `GET /site-settings`, `GET /site-settings/:section`, `PUT /site-settings/:section` | Brand‑new module: Zod‑validated JSON store, 5‑min in‑process cache, on‑boot seed, 9 typed schemas. |

**Other backend work**
- `AllExceptionsFilter` now surfaces the real Prisma validation message in non‑prod (was returning generic "Invalid database operation").
- `postinstall: prisma generate` + `build: prisma generate && nest build` so production deploys never serve a stale client.
- New users + visitor‑converted members get `needs_password_change: true` in `user_metadata`; login response exposes `needsPasswordChange`; the first‑login flow routes to `/change-password` and clears the flag on save.
- `SiteSettings` Prisma model + `SiteSection` enum, `db push`‑applied to Supabase.

### 1.2 Frontend — `everlasting-hills-church/`

**New pages**
- `/forgot-password` — Supabase reset email request
- `/dashboard/profile` — read‑only profile view (six‑section design with hero, bento contact grid, bio, insights strip, footer CTA)
- `/dashboard/settings` — editable profile + photo (two‑column form, R2 upload wired)
- `/dashboard/settings/homepage` — admin homepage content editor (tabbed JSON editor, validates against backend Zod, image upload picker copies the upload URL to clipboard as a JSON string)
- `/dashboard/members/[id]` — placeholder remained, but the list page got a full client component with smoke‑out delete animation

**New shared components**
- `AuthSplitScreen` — shell used by all four auth pages
- `ConfirmDialog` — branded modal replacing native `confirm()`, used by users CMS delete + role change, members list delete, profile photo delete
- `SiteSettingsEditor` — admin editor with side‑rail tab navigation, monospace JSON editor, field‑level error rendering, image upload helper
- `form-primitives` — `FormInput`, `FormTextarea`, `UploadDropzone` (dark‑mode aware)
- `lib/site-settings.ts` — typed content shapes, per‑section fallback constants, `getAllSiteSettings()` + `getSectionForAdmin()` server helpers

**Session / auth plumbing**
- `patchFrontendSession()` + `SESSION_CHANGED_EVENT` — sidebar and top‑right dropdown re‑read identity cookies after a profile save instead of waiting for a page reload
- Middleware: `/forgot-password` added to auth pages, `/change-password` removed (so recovery‑hash arrivals are not bounced), `/dashboard/settings/homepage` gated ADMIN+, `/dashboard/settings` stays at MEMBER

**Form migrations (16 dead `/api/*` callers)**
Every `fetch("/api/...")` was either redirected to the proper NestJS endpoint (15 of them) or stubbed with a "coming soon" message for endpoints that did not exist yet (member self‑service avatar/profile — later built).

**Homepage dynamic content — 8 of 9 sections refactored**
HERO, ABOUT, CULTURE, SCRIPTURE, SERVICE, SERMONS, COMMUNITY, CONTACT all take `content?` props from site_settings with hardcoded fallbacks. ServiceSection got a proper dynamic‑schedule rewrite (the `computeSchedule` helper replaces the old `ServiceUtils` constants). SermonsSection became an async server component fetching from `/sermons/recent` and rendering via a `RecentSermonsGrid` client child.

---

## 2. Architectural patterns established

1. **Envelope contract** — every backend response is `{ data, meta? }` for success, `{ error: { statusCode, message, code, requestId, details? } }` for errors. `serverApi` + `apiClient` unwrap automatically. Field‑level validation issues surface in `details`.
2. **Fire‑and‑forget email** — services emit `NotificationEvents.SendEmail`; `NotificationsService` handles delivery out‑of‑band so HTTP responses stay fast. BullMQ‑ready when Redis ships.
3. **Per‑section content store** — JSON‑per‑row + Zod validators + tuple types for fixed‑count structures (3 culture cards, 4 scripture pillars, 3 giving tiles). "Structure does not change, content does."
4. **In‑process 5‑min cache invalidated on write** — backend caches `findOne()` per section; frontend `revalidate: 300` matches. Admin saves land within 5 minutes on the public page.
5. **Identity‑vs‑content split** — pillar names (Word/Spirit/Community), pillar numbers (01–04), card icons, and inverted‑middle treatment stay in code. Only text/links live in settings. Admin cannot break the layout by adding a 4th culture card.
6. **Session cookie pub/sub** — `patchFrontendSession()` + custom event means a profile photo upload reflects in the sidebar/header instantly without a route refresh.
7. **Brand‑aware exit animations** — member delete uses framer‑motion smoke dissipation (blur + scale + drift + desaturate, then height collapse) instead of a snap‑out.

---

## 3. Verified end‑to‑end flows

| Flow | Status |
|---|---|
| Admin creates user → user gets welcome email → user logs in with phone → routes to /change-password → sets new password → redirects to /login → logs in with new password → /dashboard | ✅ |
| Visitor on /first-timer → admin sees them → "Make Member" → R2 photo upload works → welcome email sent | ✅ |
| Profile photo upload → instantly reflects in sidebar + top‑right dropdown without reload | ✅ |
| Admin → /dashboard/members → delete → smoke‑out animation → row gone from DB + Supabase auth | ✅ |
| Admin → /dashboard/settings/homepage → edit any of 8 wired sections → save → field‑level errors on bad JSON → public homepage picks it up within 5 min | ✅ |
| Public homepage fetches all sections in one server‑side call → falls back to bundled defaults if API is down | ✅ |
| Forgot‑password recovery flow: email → hash bridged to cookie → password updated via admin client → log in with new password | ✅ |

---

## 4. Known gaps

| Gap | Severity | Why |
|---|---|---|
| `GivingSection` not refactored | medium | Schema + seed + editor are all there, but the component itself still has hardcoded strings. ~15 min of work. |
| `/dashboard/members/[id]` still a `ComingSoon` placeholder | medium | List + delete work, clicking a row lands on a stub. |
| Admin editor is JSON‑textarea only | medium | Full control + validation feedback, but not friendly for non‑technical admins. Per‑section form widgets would be the polish layer. |
| Member self‑service avatar in `MemberHome.tsx` + `MemberProfileClient.tsx` still stubbed as "coming soon" | low | The newer settings page does this properly. These older code paths just need to be deleted or repointed. |
| Sermon discussion‑questions in `SermonForm.tsx` | low | Two endpoints do not exist on backend yet (`/sermons/:id/questions` add/delete). |
| FOOTER section | low | Mentioned in the prompt as one example, but scoped to 9 sections. |
| Tsbuildinfo + tests reference old `/dashboard/profile` paths | trivial | No functional impact. |

---

## 5. Recommended next steps

1. **Finish `GivingSection`** — closes the dynamic‑content loop completely. One file edit.
2. **Per‑section friendly forms in the admin editor** — start with HERO and CONTACT (simplest shapes, no tuples). JSON view can stay as a "Raw" tab fallback.
3. **`/dashboard/members/[id]` detail page** — natural follow‑up since the list + hard‑delete are live. The data is already there (`MembersService.getMemberById` returns attendance, notes, follow‑ups, units).
4. **Sermon discussion‑questions backend** — would let the existing SermonForm UI actually save questions.
5. **Memory hygiene** — write a memory note for the Site Settings architecture so a future session does not have to rediscover the JSON‑per‑section pattern.

---

## 6. Welcome email — diagnostic checklist

If welcome emails aren't arriving, check in order:

1. **`RESEND_API_KEY` set in backend `.env`?** If missing, `NotificationsService` logs `[member-welcome:*] dropped email to <addr> — Resend not configured` and silently drops. Look in the backend boot log for `RESEND_API_KEY not set — email sending disabled`.
2. **`RESEND_FROM` configured?** Defaults to `onboarding@resend.dev`. That sender domain is Resend's sandbox and only delivers to the account owner's verified email. To deliver to arbitrary addresses, set `RESEND_FROM` to a domain you have verified in the Resend dashboard.
3. **Resend account in sandbox?** A free Resend account only ships mail to the address that owns the API key. Verify a domain or upgrade.
4. **Recipient spam folder.** Welcome emails from new‑domain senders get filtered aggressively in Gmail.
5. **Backend log line** — search for the tag `member-welcome:admin-created` or `member-welcome:visitor-converted` in the backend output. If you see `email sent →`, Resend accepted it. If you see `email failed →`, the error message tells you what to fix.

Run `tail -200 <backend.log> | grep member-welcome` while creating a test user to see the exact path the email took.

---

*Generated 2026‑06‑01 from in‑session work analysis. See git log for the changeset.*
