# HOMEPAGE DYNAMIC CONTENT PROMPT — Everlasting Hills Church

> Use this prompt in Claude Code to wire up the homepage sections
> to be managed from the admin dashboard.

---

## CONTEXT

Read HANDOFF.md and the existing codebase. The public homepage at `app/(public)/page.tsx` currently has 9 sections. Every section has its content hardcoded directly in the component files. Nothing is editable from the admin dashboard.

The goal: an admin or pastor logs into `/dashboard`, edits homepage content (text, images, links, service times, sermons, giving details), and those changes appear on the public homepage without touching code.

This is a **headless CMS pattern built into our own platform** — not an external CMS like Sanity or Contentful.

## CURRENT STATE OF EACH SECTION

Here is exactly what is hardcoded and what needs to become dynamic:

### 1. HeroSection (`components/home/HeroSection.tsx`)

Currently hardcoded:
```
- Background carousel images (IMAGES array with local paths)
- Church name: "Everlasting Hills Church"
- Headline: "Raising men who flourish beyond limits"
- Subtext: "A Word-centered, Spirit-filled..."
- CTA button labels: "Join Us This Sunday", "Watch Sermons"
- CTA button links
- Scripture reference badge: "Rooted in Genesis 49:22–26"
- Pillar labels: Word | Spirit | Community
```

What admin should control:
```
- Hero carousel images (upload/reorder)
- Headline text
- Subtext
- CTA button 1: label + link
- CTA button 2: label + link
- Whether to show the scripture badge (toggle)
```

What should stay hardcoded:
```
- Church name (brand constant, not per-page content)
- Pillar labels (brand identity, not content)
- Layout structure, animations, design
```

### 2. AboutSection (`components/home/AboutSection.tsx`)

Currently hardcoded:
```
- Section label: "Who We Are"
- Headline: "Built on the Word. Alive in the Spirit."
- Two body paragraphs describing the church
- Slider images (Unsplash URLs)
- CTA buttons: "Join the Family", "Our Culture"
```

What admin should control:
```
- Section headline
- Body paragraphs (1-2 paragraphs, rich text or plain text)
- Gallery images (upload/reorder, replace Unsplash placeholders)
- CTA button labels + links
```

### 3. CultureSection (`components/home/CultureSection.tsx`)

Currently hardcoded:
```
- 3 culture cards (Word, Spirit, Community)
- Each has: label, headline, body, verse reference, verse text
```

What admin should control:
```
- Card headline text for each
- Card body text for each
- Verse reference + verse text for each
```

What should stay hardcoded:
```
- The 3 pillar structure (Word, Spirit, Community) — this is brand identity
- Icons, colors, layout
```

### 4. ScriptureSection (`components/home/ScriptureSection.tsx`)

Currently hardcoded:
```
- 4 scripture pillars with symbol, phrase, and detail
- Section headline: "Rooted in a promise"
- Scripture quote at bottom
```

What admin should control:
```
- Section headline
- Section description
- Each pillar's phrase and detail text (but keep the 4-pillar structure)
- The scripture quote and reference at bottom
```

### 5. ServiceSection (`components/home/ServiceSection.tsx`)

Currently hardcoded:
```
- Service schedule (uses ServiceUtils with hardcoded times)
- Location details
- Address
- Service descriptions
```

What admin should control:
```
- Service schedules: day, time, label for each service type
- Location name
- Address
- Google Maps link / coordinates
- Whether a service is currently live (manual toggle or auto from service schedule)
- Special service announcements ("No service this Sunday — church retreat")
```

### 6. SermonsSection (`components/home/SermonsSection.tsx`)

Currently:
```
- Fetches from YouTube API via useYouTubeVideos hook
- Has commented-out Prisma-based sermon fetching (was broken)
```

What it should do:
```
- Fetch latest 3-6 sermons from the database (admin manages sermons in /dashboard/sermons)
- Featured sermon displayed prominently
- Each sermon has: title, speaker, date, series, thumbnail, audio/video URL
- "View all sermons" links to /sermons
```

This is partially built — the admin sermon management exists in `/dashboard/sermons`.
The connection between admin-managed sermons and the homepage display is broken.
Fix the data pipeline: admin creates sermon → sermon appears on homepage.

### 7. CommunitySection (`components/home/CommunitySection.tsx`)

Currently hardcoded:
```
- Section headline: "Become part of something real"
- Body paragraphs
- CTA buttons: "I'm New Here", "Join a Community"
- Visual card content
```

What admin should control:
```
- Headline
- Body text
- CTA button labels + links
- Community stats (if showing member count, group count, etc.)
```

### 8. GivingSection (`components/home/GivingSection.tsx`)

Currently hardcoded:
```
- Headline: "Partner with Everlasting Hills"
- Description text
- Bank account details (name, number, bank)
- Feature cards (secure, flexible, etc.)
- CTA link to /give
```

What admin should control:
```
- Headline + description
- Bank account details (CRITICAL — these change, must be admin-editable)
- Whether to show bank details or only Paystack link
- Feature card text
```

### 9. ContactSection (`components/home/ContactSection.tsx`)

Currently hardcoded:
```
- WhatsApp link: "#"
- Instagram handle: "@everlastinghillschurch" with href "#"
- Email: "hello@everlastinghills.org"
- Contact form (submits to backend)
```

What admin should control:
```
- WhatsApp number/link
- Instagram handle + URL
- Email address
- Whether each contact method is visible (toggle)
- Any additional social links (Twitter/X, Facebook, YouTube)
```

---

## ARCHITECTURE — HOW TO BUILD THIS

### Option A: Site Settings Table (RECOMMENDED for Phase 1)

Create a single `SiteSettings` model that stores all homepage content as structured JSON. Simple, fast, one database query loads the entire homepage.

```
Database table: site_settings
  - id
  - tenant_id
  - section (enum: HERO, ABOUT, CULTURE, SCRIPTURE, SERVICE, SERMONS, COMMUNITY, GIVING, CONTACT, FOOTER)
  - content (JSON — structured, validated per section)
  - updated_at
  - updated_by
```

Each section has its own row. Content is a typed JSON blob.

Example for HERO section:
```json
{
  "headline": "Raising men who flourish beyond limits",
  "subtext": "A Word-centered, Spirit-filled, and community-focused church in Ibadan, Nigeria.",
  "cta1_label": "Join Us This Sunday",
  "cta1_link": "#services",
  "cta2_label": "Watch Sermons",
  "cta2_link": "#sermons",
  "show_scripture_badge": true,
  "carousel_images": [
    "/images/church_congregation_1.png",
    "/images/church_congregation_2.png"
  ]
}
```

Example for SERVICE section:
```json
{
  "services": [
    {
      "label": "Sunday Service",
      "day": "sunday",
      "time": "09:00",
      "end_time": "11:30",
      "description": "Main worship service"
    },
    {
      "label": "Midweek Bible Study",
      "day": "wednesday",
      "time": "17:30",
      "end_time": "19:00",
      "description": "Verse-by-verse Bible study & prayer"
    }
  ],
  "location_name": "Ibadan, Nigeria",
  "address": "Church address coming soon",
  "maps_link": null,
  "special_announcement": null
}
```

Example for CONTACT section:
```json
{
  "whatsapp": { "visible": true, "number": "+2348012345678", "label": "Chat with us" },
  "instagram": { "visible": true, "handle": "@everlastinghillschurch", "url": "https://instagram.com/everlastinghillschurch" },
  "email": { "visible": true, "address": "hello@everlastinghills.org" },
  "youtube": { "visible": false, "url": null },
  "facebook": { "visible": false, "url": null }
}
```

### Why JSON per section, not individual columns:

1. No schema migration when admin wants to add a field
2. Each section's content is loaded/saved as one atomic unit
3. Frontend gets exactly the shape it needs
4. Validation happens in Zod schemas per section type
5. Easy to add new sections later

---

## IMPLEMENTATION PLAN

### Step 1: Database + Backend

```
☐ Add SiteSettings model to Prisma schema (or Supabase table)
☐ Create Zod schemas for each section's content structure
☐ Create NestJS module: site-settings
   ☐ GET  /api/site-settings/:section     — public, cached
   ☐ GET  /api/site-settings              — all sections (for admin)
   ☐ PUT  /api/site-settings/:section     — admin only, validates with Zod
☐ Seed default content from current hardcoded values
☐ Add caching: site settings rarely change, cache for 5 minutes
   (revalidate on PUT)
```

### Step 2: Admin Dashboard — Site Settings Editor

```
☐ Create /dashboard/settings/homepage route
☐ Build a tabbed editor — one tab per section
☐ Each tab shows a form with the section's editable fields
☐ Save button calls PUT /api/site-settings/:section
☐ Image upload for hero carousel and about gallery
   (upload to Supabase Storage or Cloudflare R2, store URL in settings)
☐ Preview button (optional): opens homepage in new tab
☐ Show "Last edited by [name] on [date]" per section
```

### Step 3: Frontend — Fetch Dynamic Content

```
☐ Create a server-side utility: getSiteSettings(section)
   — calls the backend API or queries Supabase directly
   — returns typed content object
   — includes ISR revalidation (revalidate: 300 = 5 min cache)

☐ Update app/(public)/page.tsx:
   — fetch all section settings in one call
   — pass content as props to each section component

☐ Update each section component to accept content as props:
   — HeroSection receives { headline, subtext, cta1, cta2, images }
   — AboutSection receives { headline, paragraphs, images, ctas }
   — etc.
   — Components still have fallback defaults if settings are missing
   — Layout, design, animations stay in the component (not in settings)
```

### Step 4: Sermons Section — Special Case

```
Sermons section does NOT use site_settings.
It queries the sermons table directly.

☐ Fix the broken sermon data pipeline:
   — Admin creates sermon in /dashboard/sermons
   — Homepage fetches latest 3 published sermons
   — Featured sermon is the most recent with is_featured = true
   — Use server component data fetching (no client-side API call)
   — Remove or keep YouTube integration as a separate "video" source

☐ The admin controls sermons through /dashboard/sermons, not through
   /dashboard/settings/homepage
```

### Step 5: Service Schedule — Special Case

```
Service schedule could live in site_settings OR in the services table.

Recommendation: Keep it in site_settings for the recurring schedule
(every Sunday at 9am, every Wednesday at 5:30pm), but use the services
table for specific instances (this Sunday's service with attendance tracking).

The homepage shows the recurring schedule from site_settings.
The attendance system creates individual Service records from the schedule.
```

---

## DATA FLOW AFTER IMPLEMENTATION

```
Admin Dashboard                    Public Homepage
─────────────                      ────────────────
/dashboard/settings/homepage       app/(public)/page.tsx
  │                                     │
  │ PUT /api/site-settings/hero         │ Server component fetches:
  │ PUT /api/site-settings/about        │   getSiteSettings("hero")
  │ PUT /api/site-settings/service      │   getSiteSettings("about")
  │ PUT /api/site-settings/contact      │   getSiteSettings("service")
  │ PUT /api/site-settings/giving       │   getSiteSettings("contact")
  │ PUT /api/site-settings/...          │   getSiteSettings("giving")
  │         │                           │   getLatestSermons(3)
  │         ▼                           │         │
  │    Database                         │         │
  │    (site_settings table)  ◄─────────┘         │
  │                                               │
  │ /dashboard/sermons                            │
  │   Create/edit sermons ──► sermons table ──────┘
  │                                               │
  │                                               ▼
  │                              Section components render with
  │                              real data, fallback to defaults
```

---

## WHAT NOT TO MAKE DYNAMIC

These should stay hardcoded because they are brand identity, not content:

```
- Church name ("Everlasting Hills Church")
- Brand colors (#87102C palette)
- Pillar structure (Word | Spirit | Community)
- Number of culture cards (always 3)
- Number of scripture pillars (always 4)
- Layout patterns, animations, design system
- Navigation structure
- Footer structure (can make social links dynamic)
```

The line: **content changes, structure doesn't.**

An admin can change "Shaped by Scripture" to "Grounded in the Word" — but they can't add a 4th culture card or rearrange the section order. That's a code change, not a content change. This keeps the design consistent and prevents admin mistakes from breaking the layout.

---

## START HERE

Begin by:
1. Reading the current section components to confirm the hardcoded content matches what I described above
2. Design the Zod schemas for each section's content
3. Create the database table
4. Seed it with the current hardcoded values
5. Build the GET endpoint (public)
6. Wire up the homepage to fetch from the API
7. Build the PUT endpoint (admin)
8. Build the admin settings editor UI

Do NOT change any section's visual design. Only change where the data comes from.
The sections should look exactly the same after this change — the only difference is that the text/images/links come from the database instead of being hardcoded in the component file.
