# Deployment Guide

How to ship this app to production. Frontend goes to **Vercel**, backend goes to **Railway**, database is **Supabase**.

```
┌─────────────────┐    HTTPS     ┌──────────────────┐    pgbouncer    ┌──────────────┐
│  Vercel (Next)  │ ───────────▶ │ Railway (NestJS) │ ──────────────▶ │  Supabase    │
│  the website    │              │  the API         │                 │  Postgres    │
└─────────────────┘              └──────────────────┘                 └──────────────┘
       ▲                                                                      ▲
       │  cookies (JWT)                                                       │
       │                                                                       │ JWKS
       └──────────────────────── Supabase Auth ◄──────────────────────────────┘
```

Plan: deploy backend first (Vercel needs to know its URL), then frontend.

---

## ⚙ Prerequisites (one-time)

1. **Supabase project** — already exists. From the dashboard you'll need:
   - Project URL (`https://YOUR_PROJECT.supabase.co`)
   - `anon` key
   - `service_role` key
   - DB connection strings (Settings → Database)

2. **Cloudflare R2 bucket** — for sermon audio. Get:
   - Account ID, Access Key ID, Secret Access Key
   - Bucket name, Public URL

3. **Resend account** — for transactional email. Get an API key.

4. **GitHub repo** — both apps committed and pushed to the same repo (monorepo).

5. **Domain name** (optional but recommended) — for HTTPS on the frontend.

---

## 1️⃣ Deploy the backend to Railway

### a) Create the service

1. Log in at https://railway.app
2. **New Project** → **Deploy from GitHub Repo** → pick the church repo
3. Railway will detect Node. After it creates the service, open Settings:
   - **Root Directory**: `ehc-backend`
   - **Build Command**: leave blank (railway.json handles it)
   - **Start Command**: leave blank (railway.json handles it)
4. Railway will auto-detect `railway.json` and use its `buildCommand` / `startCommand`.

### b) Set environment variables

Open the service → **Variables** → paste these (copy from `ehc-backend/.env.production.example`):

```
NODE_ENV=production
DATABASE_URL=postgresql://...                  ← from Supabase dashboard
DIRECT_URL=postgresql://...                    ← from Supabase dashboard
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
DEFAULT_TENANT_ID=ehc_xxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_...                          ← optional but recommended
RESEND_FROM=hello@everlastinghills.org
RESEND_ADMIN_EMAIL=admin@everlastinghills.org
FRONTEND_URL=https://everlastinghills.org      ← required! (or temp Vercel URL — update after step 2)
```

**Important**: `FRONTEND_URL` is REQUIRED in production. The app refuses to start without it (CORS lockdown).

### c) Deploy

1. Click **Deploy**. First build takes 3–5 minutes.
2. Railway will assign a URL like `https://ehc-backend-production.up.railway.app`
3. **Copy that URL** — you'll need it for the frontend in step 2.

### d) Smoke-test

Open `https://YOUR_BACKEND.up.railway.app/sermons/published` in a browser. You should see JSON like `{"data":[...],"meta":{"timestamp":"..."}}`. If you see an error, check the Railway logs.

### e) Custom domain (optional)

Settings → **Domains** → add `api.everlastinghills.org` → follow DNS instructions. Then update `FRONTEND_URL` env on Railway to use the custom domain if you switch.

---

## 2️⃣ Deploy the frontend to Vercel

### a) Create the project

1. Log in at https://vercel.com
2. **Add New → Project** → import the same GitHub repo
3. Vercel will ask for the **Root Directory** — set it to `everlasting-hills-church`
4. **Framework Preset**: Next.js (auto-detected)
5. **Build / Output**: leave defaults (Vercel reads `next.config.mjs`)

### b) Set environment variables

Click **Environment Variables** and paste these (copy from `everlasting-hills-church/.env.production.example`):

```
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND.up.railway.app   ← from step 1c
NEXT_PUBLIC_APP_URL=https://everlastinghills.org                ← your frontend domain
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
RESEND_API_KEY=re_...
RESEND_FROM=hello@everlastinghills.org
DEFAULT_TENANT_ID=ehc_xxxxxxxxxxxxxxxxxxxx
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ehc-sermons
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

Apply to **Production, Preview, and Development** (the three checkboxes).

### c) Deploy

Click **Deploy**. Build takes 1–2 minutes. Vercel assigns a URL like `https://everlasting-hills-church.vercel.app`.

### d) Tell Railway the real frontend URL

If you used a placeholder `FRONTEND_URL` on Railway, **update it now** to the actual Vercel URL or custom domain. Otherwise login + API calls from the deployed site will fail with CORS errors.

### e) Custom domain (optional)

Vercel → **Settings → Domains** → add `everlastinghills.org` → follow DNS instructions.

---

## 3️⃣ Database migration

If you've made schema changes locally that haven't been pushed to production yet:

```bash
cd ehc-backend
npx prisma db push
# OR (preferred for prod): commit a migration first
# npx prisma migrate dev --name your_change
# npx prisma migrate deploy   ← Railway's build doesn't run this, see Section 5
```

For Railway, the safest path is to run migrations from your local machine with the prod `DATABASE_URL` set temporarily, OR add `npx prisma migrate deploy` to the Railway buildCommand.

---

## 4️⃣ Verification checklist

After both services are deployed:

### Backend
- [ ] `https://YOUR_BACKEND.up.railway.app/sermons/published` returns JSON `{"data":[...]}`
- [ ] `https://YOUR_BACKEND.up.railway.app/members` returns `401` (guards working)
- [ ] `https://YOUR_BACKEND.up.railway.app/docs` shows Swagger
- [ ] Railway logs show `church-api running on http://localhost:PORT`

### Frontend
- [ ] `https://YOUR_FRONTEND/` loads the homepage
- [ ] `https://YOUR_FRONTEND/sermons` shows the sermon list (empty or populated)
- [ ] `https://YOUR_FRONTEND/login` lets you sign in
- [ ] After login, you reach `/dashboard` without redirect loops
- [ ] Hard-refresh the homepage — testimonials carousel loads from the backend

### Database
- [ ] Supabase dashboard shows the `Testimonial` table (and all others)
- [ ] You can `SELECT * FROM "Tenant"` and see your tenant row

---

## 5️⃣ Recurring deployments (CI/CD)

After this initial setup:

- **Push to `main`** → both Vercel and Railway auto-deploy
- **Open a PR** → Vercel creates a preview URL (the backend's CORS regex auto-allows `*.vercel.app` previews; toggle off with `CORS_ALLOW_VERCEL_PREVIEWS=false` if you want strict)
- **Run migrations** before pushing schema changes:
  ```bash
  cd ehc-backend
  DATABASE_URL=$PROD_URL DIRECT_URL=$PROD_DIRECT npx prisma migrate deploy
  ```

---

## 6️⃣ Common issues

| Symptom | Fix |
|---|---|
| **Login → "no response from server"** | Frontend's `NEXT_PUBLIC_API_BASE_URL` is wrong or the backend's `FRONTEND_URL` doesn't match the actual Vercel URL (CORS) |
| **Login → 401, "Invalid email or password"** | Wrong Supabase keys, OR the user account doesn't exist in Supabase auth |
| **Dashboard → infinite redirect** | `ehc_role` cookie is missing/null. User has no Profile row in DB |
| **Sermon thumbnails broken** | `next.config.mjs` image domains don't include your R2 public URL — already configured for `**.r2.dev` |
| **Backend crashes on boot: "FRONTEND_URL must be set"** | Add `FRONTEND_URL` env var on Railway |
| **Prisma error: "prepared statement s1 already exists"** | Schema engine is using pgbouncer pool — make sure `DIRECT_URL` is set (port 5432, not 6543) |
| **`P2021` table doesn't exist** | Run `npx prisma db push` (or `migrate deploy`) against the prod DB |

---

## 7️⃣ What's NOT yet wired (future work)

- **Cron jobs** — Vercel cron paths were removed (they pointed at dead Next.js API routes). Scheduled tasks (sermon auto-publish, birthday alerts, weekly absence alerts) should move to the backend via `@nestjs/schedule`. Free Railway plan supports cron via a worker service.
- **Email queue (BullMQ)** — currently fire-and-forget via `EventEmitter2`. For retries on Resend failures, add Redis (Upstash free tier) and swap in BullMQ.
- **HttpOnly cookies** — JWT is currently JS-readable so axios can attach it. Proper hardening: proxy all browser→backend traffic through Next.js route handlers.
- **Sentry / OpenTelemetry** — add `@sentry/nestjs` + `@sentry/nextjs` once you have a Sentry account.

---

*If you hit a snag during deployment that isn't in §6, paste the error message to your developer and they'll get you unblocked.*
